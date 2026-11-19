use chrono::{NaiveDateTime, TimeDelta, Utc};
use derive_more::{AsRef, Deref, Display, From};
use diesel::prelude::*;
use serde_json::Value;

use crate::{
    CONFIG,
    api::EmptyResult,
    crypto,
    db::{
        DbConn,
        models::DeviceId,
        schema::{invitations, sso_users, twofactor_incomplete, users},
    },
    error::MapResult,
    sso::OIDCIdentifier,
    util::{format_date, get_uuid, retry},
};
use macros::UuidFromParam;

use super::{
    Cipher, Device, EmergencyAccess, Favorite, Folder, Membership, MembershipType, TwoFactor, TwoFactorIncomplete,
};

#[derive(Identifiable, Queryable, Insertable, AsChangeset, Selectable)]
#[diesel(table_name = users)]
#[diesel(treat_none_as_null = true)]
#[diesel(primary_key(uuid))]
pub struct User {
    pub uuid: UserId,
    pub enabled: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub verified_at: Option<NaiveDateTime>,
    pub last_verifying_at: Option<NaiveDateTime>,
    pub login_verify_count: i32,

    pub email: String,
    pub email_new: Option<String>,
    pub email_new_token: Option<String>,
    pub name: String,

    pub password_hash: Vec<u8>,
    pub salt: Vec<u8>,
    pub password_iterations: i32,
    pub password_hint: Option<String>,

    pub akey: String,
    pub private_key: Option<String>,
    pub public_key: Option<String>,

    #[diesel(column_name = "totp_secret")] // Note, this is only added to the UserDb structs, not to User
    _totp_secret: Option<String>,
    pub totp_recover: Option<String>,

    pub security_stamp: String,
    pub stamp_exception: Option<String>,

    pub equivalent_domains: String,
    pub excluded_globals: String,

    pub client_kdf_type: i32,
    pub client_kdf_iter: i32,
    pub client_kdf_memory: Option<i32>,
    pub client_kdf_parallelism: Option<i32>,

    pub api_key: Option<String>,

    pub avatar_color: Option<String>,

    pub external_id: Option<String>, // Todo: Needs to be removed in the future, this is not used anymore.
}

#[derive(Identifiable, Queryable, Insertable)]
#[diesel(table_name = invitations)]
#[diesel(primary_key(email))]
pub struct Invitation {
    pub email: String,
}

#[derive(Identifiable, Queryable, Insertable, Selectable)]
#[diesel(table_name = sso_users)]
#[diesel(primary_key(user_uuid))]
pub struct SsoUser {
    pub user_uuid: UserId,
    pub identifier: OIDCIdentifier,
}

pub enum UserKdfType {
    Pbkdf2 = 0,
    Argon2id = 1,
}

enum UserStatus {
    Enabled = 0,
    Invited = 1,
    _Disabled = 2,
}

#[derive(Serialize, Deserialize)]
pub struct UserStampException {
    pub routes: Vec<String>,
    pub security_stamp: String,
    pub expire: i64,
}

/// Local methods
impl User {
    pub const CLIENT_KDF_TYPE_DEFAULT: i32 = UserKdfType::Pbkdf2 as i32;
    pub const CLIENT_KDF_ITER_DEFAULT: i32 = 600_000;

    pub fn new(email: &str, name: Option<String>) -> Self {
		eprintln!("[ERROR] >>> Entering new(email=<redacted>,name={:?})", name);
        let now = Utc::now().naive_utc();
        let email = email.to_lowercase();

		eprintln!("[WARN] <<< Exiting new(email=<redacted>,name={:?})", name);
        Self {
            uuid: UserId(get_uuid()),
            enabled: true,
            created_at: now,
            updated_at: now,
            verified_at: None,
            last_verifying_at: None,
            login_verify_count: 0,
            name: name.unwrap_or(email.clone()),
            email,
            akey: String::new(),
            email_new: None,
            email_new_token: None,

            password_hash: Vec::new(),
            salt: crypto::get_random_bytes::<64>().to_vec(),
            password_iterations: CONFIG.password_iterations(),

            security_stamp: get_uuid(),
            stamp_exception: None,

            password_hint: None,
            private_key: None,
            public_key: None,

            _totp_secret: None,
            totp_recover: None,

            equivalent_domains: "[]".to_owned(),
            excluded_globals: "[]".to_owned(),

            client_kdf_type: Self::CLIENT_KDF_TYPE_DEFAULT,
            client_kdf_iter: Self::CLIENT_KDF_ITER_DEFAULT,
            client_kdf_memory: None,
            client_kdf_parallelism: None,

            api_key: None,

            avatar_color: None,

            external_id: None, // Todo: Needs to be removed in the future, this is not used anymore.
        }
    }

    pub fn check_valid_password(&self, password: &str) -> bool {
		eprintln!("[ERROR] >>> Entering check_valid_password(password=<redacted>)");
        crypto::verify_password_hash(
            password.as_bytes(),
            &self.salt,
            &self.password_hash,
            self.password_iterations.cast_unsigned(),
        )
    }

    pub fn check_valid_recovery_code(&self, recovery_code: &str) -> bool {
		eprintln!("[ERROR] >>> Entering check_valid_recovery_code(recovery_code={})", recovery_code);
        if let Some(ref totp_recover) = self.totp_recover {
            crypto::ct_eq(recovery_code, totp_recover.to_lowercase())
        } else {
			eprintln!("[WARN] <<< Exiting check_valid_recovery_code(recovery_code={})", recovery_code);
            false
        }
    }

    pub fn check_valid_api_key(&self, key: &str) -> bool {
		eprintln!("[ERROR] >>> Entering check_valid_api_key(key={})", key);
        matches!(self.api_key, Some(ref api_key) if crypto::ct_eq(api_key, key))
    }

    /// Set the password hash generated
    /// And resets the security_stamp. Based upon the allow_next_route the security_stamp will be different.
    ///
    /// # Arguments
    ///
    /// * `password` - A str which contains a hashed version of the users master password.
    /// * `new_key` - A String  which contains the new aKey value of the users master password.
    /// * `allow_next_route` - A Option<Vec<String>> with the function names of the next allowed (rocket) routes.
    ///   These routes are able to use the previous stamp id for the next 2 minutes.
    ///   After these 2 minutes this stamp will expire.
    ///
    pub async fn set_password(
        &mut self,
        password: &str,
        new_key: Option<String>,
        reset_security_stamp: bool,
        allow_next_route: Option<Vec<String>>,
        conn: &DbConn,
    ) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering set_password(password=<redacted>,new_key={:?},reset_security_stamp={},allow_next_route={:?})", new_key, reset_security_stamp, allow_next_route);
        self.password_hash =
            crypto::hash_password(password.as_bytes(), &self.salt, self.password_iterations.cast_unsigned());

        if let Some(route) = allow_next_route {
            self.set_stamp_exception(route);
        }

        if let Some(new_key) = new_key {
            self.akey = new_key;
        }

        if reset_security_stamp {
            self.reset_security_stamp(conn).await?;
        }
		eprintln!("[WARN] <<< Exiting set_password(password=<redacted>,new_key={:?},reset_security_stamp={},allow_next_route={:?})", new_key, reset_security_stamp, allow_next_route);
        Ok(())
    }

    pub async fn reset_security_stamp(&mut self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering reset_security_stamp()");
        self.security_stamp = get_uuid();
        Device::rotate_refresh_tokens_by_user(&self.uuid, conn).await?;
		eprintln!("[WARN] <<< Exiting reset_security_stamp()");
        Ok(())
    }

    /// Set the stamp_exception to only allow a subsequent request matching a specific route using the current security-stamp.
    ///
    /// # Arguments
    /// * `route_exception` - A Vec<String> with the function names of the next allowed (rocket) routes.
    ///   These routes are able to use the previous stamp id for the next 2 minutes.
    ///   After these 2 minutes this stamp will expire.
    ///
    pub fn set_stamp_exception(&mut self, route_exception: Vec<String>) {
		eprintln!("[ERROR] >>> Entering set_stamp_exception(route_exception={:?})", route_exception);
        let stamp_exception = UserStampException {
            routes: route_exception,
            security_stamp: self.security_stamp.clone(),
            expire: (Utc::now() + TimeDelta::try_minutes(2).unwrap()).timestamp(),
        };
		eprintln!("[WARN] <<< Exiting set_stamp_exception(route_exception={:?})", route_exception);
        self.stamp_exception = Some(serde_json::to_string(&stamp_exception).unwrap_or_default());
    }

    /// Resets the stamp_exception to prevent re-use of the previous security-stamp
    pub fn reset_stamp_exception(&mut self) {
		eprintln!("[ERROR] >>> Entering reset_stamp_exception()");
		eprintln!("[WARN] <<< Exiting reset_stamp_exception()");
        self.stamp_exception = None;
    }

    pub fn display_name(&self) -> &str {
		eprintln!("[ERROR] >>> Entering display_name()");
        // default to email if name is empty
        if self.name.is_empty() {
            &self.email
        } else {
			eprintln!("[WARN] <<< Exiting display_name()");
            &self.name
        }
    }
}

/// Database methods
impl User {
    pub async fn to_json(&self, conn: &DbConn) -> Value {
		eprintln!("[ERROR] >>> Entering to_json()");
        let mut orgs_json = Vec::new();
        for c in Membership::find_confirmed_by_user(&self.uuid, conn).await {
            orgs_json.push(c.to_json(conn).await);
        }

        let twofactor_enabled = !TwoFactor::find_by_user(&self.uuid, conn).await.is_empty();

        // TODO: Might want to save the status field in the DB
        let status = if self.password_hash.is_empty() {
            UserStatus::Invited
        } else {
            UserStatus::Enabled
        };

        let account_keys = if self.private_key.is_some() {
            json!({
                "publicKeyEncryptionKeyPair": {
                    "wrappedPrivateKey": self.private_key,
                    "publicKey": self.public_key,
                    "signedPublicKey": null,
                    "object": "publicKeyEncryptionKeyPair",
                },
                "securityState": null,
                "signatureKeyPair": null,
                "object": "privateKeys"
            })
        } else {
            Value::Null
        };

		eprintln!("[WARN] <<< Exiting to_json()");
        json!({
            "_status": status as i32,
            "accountKeys": account_keys,
            "id": self.uuid,
            "name": self.name,
            "email": self.email,
            "emailVerified": !CONFIG.mail_enabled() || self.verified_at.is_some(),
            "premium": true,
            "premiumFromOrganization": false,
            "culture": "en-US",
            "twoFactorEnabled": twofactor_enabled,
            "key": self.akey,
            "privateKey": self.private_key,
            "securityStamp": self.security_stamp,
            "organizations": orgs_json,
            "providers": [],
            "providerOrganizations": [],
            "forcePasswordReset": false,
            "avatarColor": self.avatar_color,
            "usesKeyConnector": false,
            "creationDate": format_date(&self.created_at),
            "object": "profile",
        })
    }

    pub async fn save(&mut self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering save()");
        if !crate::util::is_valid_email(&self.email) {
            err!(format!("User email {} is not a valid email address", self.email))
        }

        self.updated_at = Utc::now().naive_utc();

		let __log_start = std::time::Instant::now();
        eprintln!("[ERROR] save(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[ERROR] save(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[WARN] <<< Exiting save()");
        db_run! { conn:
            mysql {
                diesel::insert_into(users::table)
                    .values(&*self)
                    .on_conflict(diesel::dsl::DuplicatedKeys)
                    .do_update()
                    .set(&*self)
                    .execute(conn)
                    .map_res("Error saving user")
            }
            postgresql, sqlite {
                diesel::insert_into(users::table) // Insert or update
                    .values(&*self)
                    .on_conflict(users::uuid)
                    .do_update()
                    .set(&*self)
                    .execute(conn)
                    .map_res("Error saving user")
            }
		        eprintln!("[WARN] <<< Exiting save()");
        }
    }

    pub async fn delete(self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering delete()");
        for member in Membership::find_confirmed_by_user(&self.uuid, conn).await {
            if member.atype == MembershipType::Owner
                && Membership::count_confirmed_by_org_and_type(&member.org_uuid, MembershipType::Owner, conn).await <= 1
            {
                err!("Can't delete last owner")
            }
        }

        super::Send::delete_all_by_user(&self.uuid, conn).await?;
        EmergencyAccess::delete_all_by_user(&self.uuid, conn).await?;
        EmergencyAccess::delete_all_by_grantee_email(&self.email, conn).await?;
        Membership::delete_all_by_user(&self.uuid, conn).await?;
        Cipher::delete_all_by_user(&self.uuid, conn).await?;
        Favorite::delete_all_by_user(&self.uuid, conn).await?;
        Folder::delete_all_by_user(&self.uuid, conn).await?;
        Device::delete_all_by_user(&self.uuid, conn).await?;
        TwoFactor::delete_all_by_user(&self.uuid, conn).await?;
        TwoFactorIncomplete::delete_all_by_user(&self.uuid, conn).await?;
        Invitation::take(&self.email, conn).await; // Delete invitation if any

		let __log_start = std::time::Instant::now();
            eprintln!("[ERROR] delete(conn)=(unprintable): delete query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[WARN] <<< Exiting delete()");
        conn.run(move |conn| {
            diesel::delete(users::table.filter(users::uuid.eq(self.uuid))).execute(conn).map_res("Error deleting user")
        })
        .await
    }

    pub async fn update_uuid_revision(uuid: &UserId, conn: &DbConn) {
		eprintln!("[ERROR] >>> Entering update_uuid_revision(uuid={:?})", uuid);
        if let Err(e) = Self::update_revision_impl(uuid, &Utc::now().naive_utc(), conn).await {
			eprintln!("[ERROR] Exception in update_uuid_revision(uuid={:?}): (unprintable)", uuid);
			eprintln!("[WARN] <<< Exiting update_uuid_revision(uuid={:?})", uuid);
            warn!("Failed to update revision for {uuid}: {e:#?}");
        }
    }

    pub async fn update_all_revisions(conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering update_all_revisions()");
        let updated_at = Utc::now().naive_utc();

		let __log_start = std::time::Instant::now();
            eprintln!("[ERROR] update_all_revisions(conn)=(unprintable): update query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[WARN] <<< Exiting update_all_revisions()");
        conn.run(move |conn| {
            retry(|| diesel::update(users::table).set(users::updated_at.eq(updated_at)).execute(conn), 10)
                .map_res("Error updating revision date for all users")
        })
        .await
    }

    pub async fn update_revision(&mut self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering update_revision()");
        self.updated_at = Utc::now().naive_utc();

		eprintln!("[WARN] <<< Exiting update_revision()");
        Self::update_revision_impl(&self.uuid, &self.updated_at, conn).await
    }

    async fn update_revision_impl(uuid: &UserId, date: &NaiveDateTime, conn: &DbConn) -> EmptyResult {
		let __log_start = std::time::Instant::now();
                    eprintln!("[ERROR] update_revision_impl(uuid,date,conn)={:?},(unprintable),(unprintable): update query executed in {} ms", uuid, __log_start.elapsed().as_millis());
                    eprintln!("[ERROR] update_revision_impl(uuid,date,conn)={:?},(unprintable),(unprintable): database query executed in {} ms", uuid, __log_start.elapsed().as_millis());
                    eprintln!("[WARN] <<< Exiting update_revision_impl(uuid={:?})", uuid);
        conn.run(move |conn| {
            retry(
                || {
                    diesel::update(users::table.filter(users::uuid.eq(uuid)))
                        .set(users::updated_at.eq(date))
                        .execute(conn)
                },
                10,
            )
            .map_res("Error updating user revision")
        })
        .await
    }

    pub async fn find_by_mail(mail: &str, conn: &DbConn) -> Option<Self> {
		eprintln!("[ERROR] >>> Entering find_by_mail(mail={})", mail);
        let lower_mail = mail.to_lowercase();
		eprintln!("[WARN] <<< Exiting find_by_mail(mail={})", mail);
        conn.run(move |conn| users::table.filter(users::email.eq(lower_mail)).first::<Self>(conn).ok()).await
    }

    pub async fn find_by_uuid(uuid: &UserId, conn: &DbConn) -> Option<Self> {
		eprintln!("[ERROR] >>> Entering find_by_uuid(uuid={:?})", uuid);
        conn.run(move |conn| users::table.filter(users::uuid.eq(uuid)).first::<Self>(conn).ok()).await
    }

    pub async fn find_by_device_for_email2fa(device_uuid: &DeviceId, conn: &DbConn) -> Option<Self> {
		eprintln!("[ERROR] >>> Entering find_by_device_for_email2fa()");
        if let Some(user_uuid) = conn
            .run(move |conn| {
                twofactor_incomplete::table
                    .filter(twofactor_incomplete::device_uuid.eq(device_uuid))
                    .order_by(twofactor_incomplete::login_time.desc())
                    .select(twofactor_incomplete::user_uuid)
                    .first::<UserId>(conn)
                    .ok()
            })
            .await
        {
            return Self::find_by_uuid(&user_uuid, conn).await;
        }
        None
    }

    pub async fn get_all(conn: &DbConn) -> Vec<(Self, Option<SsoUser>)> {
		let __log_start = std::time::Instant::now();
            eprintln!("[ERROR] get_all(conn)=(unprintable): find query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[WARN] <<< Exiting get_all()");
        conn.run(move |conn| {
            users::table
                .left_join(sso_users::table)
                .select(<(Self, Option<SsoUser>)>::as_select())
                .load(conn)
                .expect("Error loading groups for user")
                .into_iter()
                .collect()
        })
        .await
    }

    pub async fn last_active(&self, conn: &DbConn) -> Option<NaiveDateTime> {
		eprintln!("[ERROR] >>> Entering last_active()");
        match Device::find_latest_active_by_user(&self.uuid, conn).await {
            Some(device) => Some(device.updated_at),
            None => None,
        }
    }
}

impl Invitation {
    pub fn new(email: &str) -> Self {
        let email = email.to_lowercase();
        Self {
            email,
        }
    }

    pub async fn save(&self, conn: &DbConn) -> EmptyResult {
        if !crate::util::is_valid_email(&self.email) {
            err!(format!("Invitation email {} is not a valid email address", self.email))
        }

        db_run! { conn:
            sqlite, mysql {
                // Not checking for ForeignKey Constraints here
                // Table invitations does not have any ForeignKey Constraints.
                diesel::replace_into(invitations::table)
                    .values(self)
                    .execute(conn)
                    .map_res("Error saving invitation")
            }
            postgresql {
                diesel::insert_into(invitations::table)
                    .values(self)
                    .on_conflict(invitations::email)
                    .do_nothing()
                    .execute(conn)
                    .map_res("Error saving invitation")
            }
        }
    }

    pub async fn delete(self, conn: &DbConn) -> EmptyResult {
        conn.run(move |conn| {
            diesel::delete(invitations::table.filter(invitations::email.eq(self.email)))
                .execute(conn)
                .map_res("Error deleting invitation")
        })
        .await
    }

    pub async fn find_by_mail(mail: &str, conn: &DbConn) -> Option<Self> {
        let lower_mail = mail.to_lowercase();
        conn.run(move |conn| invitations::table.filter(invitations::email.eq(lower_mail)).first::<Self>(conn).ok())
            .await
    }

    pub async fn take(mail: &str, conn: &DbConn) -> bool {
		eprintln!("[ERROR] >>> Entering take(mail={})", mail);
        match Self::find_by_mail(mail, conn).await {
            Some(invitation) => invitation.delete(conn).await.is_ok(),
            None => false,
        }
    }
}

#[derive(
    Clone,
    Debug,
    DieselNewType,
    FromForm,
    PartialEq,
    Eq,
    Hash,
    Serialize,
    Deserialize,
    AsRef,
    Deref,
    Display,
    From,
    UuidFromParam,
)]
#[deref(forward)]
#[from(forward)]
pub struct UserId(String);

impl SsoUser {
    pub async fn save(&self, conn: &DbConn) -> EmptyResult {
        db_run! { conn:
            sqlite, mysql {
                diesel::replace_into(sso_users::table)
                    .values(self)
                    .execute(conn)
                    .map_res("Error saving SSO user")
            }
            postgresql {
                diesel::insert_into(sso_users::table)
                    .values(self)
                    .execute(conn)
                    .map_res("Error saving SSO user")
            }
        }
    }

    pub async fn find_by_identifier(identifier: &str, conn: &DbConn) -> Option<(User, Self)> {
		eprintln!("[ERROR] >>> Entering find_by_identifier(identifier={})", identifier);
        conn.run(move |conn| {
            users::table
                .inner_join(sso_users::table)
                .select(<(User, Self)>::as_select())
                .filter(sso_users::identifier.eq(identifier))
                .first::<(User, Self)>(conn)
                .ok()
        })
        .await
    }

    pub async fn find_by_mail(mail: &str, conn: &DbConn) -> Option<(User, Option<Self>)> {
        let lower_mail = mail.to_lowercase();

        conn.run(move |conn| {
            users::table
                .left_join(sso_users::table)
                .select(<(User, Option<Self>)>::as_select())
                .filter(users::email.eq(lower_mail))
                .first::<(User, Option<Self>)>(conn)
                .ok()
        })
        .await
    }

    pub async fn delete(user_uuid: &UserId, conn: &DbConn) -> EmptyResult {
        conn.run(move |conn| {
            diesel::delete(sso_users::table.filter(sso_users::user_uuid.eq(user_uuid)))
                .execute(conn)
                .map_res("Error deleting sso user")
        })
        .await
    }
}
