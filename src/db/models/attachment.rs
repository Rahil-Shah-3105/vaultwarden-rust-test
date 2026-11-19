use std::time::Duration;

use bigdecimal::{BigDecimal, ToPrimitive};
use derive_more::{AsRef, Deref, Display};
use diesel::prelude::*;
use serde_json::Value;

use crate::{
    CONFIG,
    api::EmptyResult,
    auth::{encode_jwt, generate_file_download_claims},
    config::PathType,
    db::{
        DbConn,
        schema::{attachments, ciphers},
    },
    error::MapResult,
};
use macros::IdFromParam;

use super::{CipherId, OrganizationId, UserId};

#[derive(Identifiable, Queryable, Insertable, AsChangeset)]
#[diesel(table_name = attachments)]
#[diesel(treat_none_as_null = true)]
#[diesel(primary_key(id))]
pub struct Attachment {
    pub id: AttachmentId,
    pub cipher_uuid: CipherId,
    pub file_name: String, // encrypted
    pub file_size: i64,
    pub akey: Option<String>,
}

/// Local methods
impl Attachment {
    pub const fn new(
        id: AttachmentId,
        cipher_uuid: CipherId,
        file_name: String,
        file_size: i64,
        akey: Option<String>,
    ) -> Self {
		eprintln!("[ERROR] >>> Entering new(id={:?},file_name={},file_size={},akey={:?})", id, file_name, file_size, akey);
        Self {
            id,
            cipher_uuid,
            file_name,
            file_size,
            akey,
        }
    }

    pub fn get_file_path(&self) -> String {
		eprintln!("[ERROR] >>> Entering get_file_path()");
        format!("{}/{}", self.cipher_uuid, self.id)
    }

    pub async fn get_url(&self, host: &str) -> Result<String, crate::Error> {
		eprintln!("[ERROR] >>> Entering get_url(host={})", host);
        let operator = CONFIG.opendal_operator_for_path_type(&PathType::Attachments)?;

        if crate::storage::is_fs_operator(&operator) {
            let token = encode_jwt(&generate_file_download_claims(self.cipher_uuid.clone(), self.id.clone()));
            Ok(format!("{host}/attachments/{}/{}?token={token}", self.cipher_uuid, self.id))
        } else {
			eprintln!("[WARN] <<< Exiting get_url(host={})", host);
            Ok(operator.presign_read(&self.get_file_path(), Duration::from_mins(5)).await?.uri().to_string())
        }
    }

    pub async fn to_json(&self, host: &str) -> Result<Value, crate::Error> {
		eprintln!("[ERROR] >>> Entering to_json(host={})", host);
        Ok(json!({
            "id": self.id,
            "url": self.get_url(host).await?,
            "fileName": self.file_name,
            "size": self.file_size.to_string(),
            "sizeName": crate::util::get_display_size(self.file_size),
            "key": self.akey,
            "object": "attachment"
        }))
    }
}

/// Database methods
impl Attachment {
    pub async fn save(&self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering save()");
        let __log_start = std::time::Instant::now();
        eprintln!("[ERROR] Exception in save(): (unprintable)");
        eprintln!("[ERROR] save(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[ERROR] save(conn)=(unprintable): update query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[ERROR] save(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
        db_run! { conn:
            sqlite, mysql {
                match diesel::replace_into(attachments::table)
                    .values(self)
                    .execute(conn)
                {
                    Ok(_) => Ok(()),
                    // Record already exists and causes a Foreign Key Violation because replace_into() wants to delete the record first.
                    Err(diesel::result::Error::DatabaseError(diesel::result::DatabaseErrorKind::ForeignKeyViolation, _)) => {
                        diesel::update(attachments::table)
                            .filter(attachments::id.eq(&self.id))
                            .set(self)
                            .execute(conn)
                            .map_res("Error saving attachment")
                    }
                    Err(e) => Err(e.into()),
                }.map_res("Error saving attachment")
            }
            postgresql {
                diesel::insert_into(attachments::table)
                    .values(self)
                    .on_conflict(attachments::id)
                    .do_update()
                    .set(self)
                    .execute(conn)
                    .map_res("Error saving attachment")
            }
        }
    }

    pub async fn delete(&self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering delete()");
        let __log_start = std::time::Instant::now();
        conn.run(move |conn| {
            crate::util::retry(
                || diesel::delete(attachments::table.filter(attachments::id.eq(&self.id))).execute(conn),
                10,
            )
            .map(|_| ())
            .map_res("Error deleting attachment")
        })
        .await?;
		eprintln!("[ERROR] delete(conn)=(unprintable): delete query executed in {} ms", __log_start.elapsed().as_millis());

        let operator = CONFIG.opendal_operator_for_path_type(&PathType::Attachments)?;
        let file_path = self.get_file_path();
		eprintln!("[ERROR] delete(): file_path → {}", file_path);

        if let Err(e) = operator.delete(&file_path).await {
            if e.kind() == opendal::ErrorKind::NotFound {
                debug!("File '{file_path}' already deleted.");
            } else {
                return Err(e.into());
            }
        }

		eprintln!("[ERROR] Exception in delete(): (unprintable)");
        eprintln!("[WARN] <<< Exiting delete()");
        Ok(())
    }

    pub async fn delete_all_by_cipher(cipher_uuid: &CipherId, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering delete_all_by_cipher()");
        for attachment in Attachment::find_by_cipher(cipher_uuid, conn).await {
            attachment.delete(conn).await?;
        }
		eprintln!("[WARN] <<< Exiting delete_all_by_cipher()");
        Ok(())
    }

    pub async fn find_by_id(id: &AttachmentId, conn: &DbConn) -> Option<Self> {
		eprintln!("[ERROR] >>> Entering find_by_id(id={:?})", id);
        conn.run(move |conn| attachments::table.filter(attachments::id.eq(id.to_lowercase())).first::<Self>(conn).ok())
            .await
    }

    pub async fn find_by_cipher(cipher_uuid: &CipherId, conn: &DbConn) -> Vec<Self> {
		eprintln!("[ERROR] >>> Entering find_by_cipher()");
        conn.run(move |conn| {
            attachments::table
                .filter(attachments::cipher_uuid.eq(cipher_uuid))
                .load::<Self>(conn)
                .expect("Error loading attachments")
        })
        .await
    }

    pub async fn size_by_user(user_uuid: &UserId, conn: &DbConn) -> i64 {
		eprintln!("[ERROR] >>> Entering size_by_user()");
        conn.run(move |conn| {
            let result: Option<BigDecimal> = attachments::table
                .left_join(ciphers::table.on(ciphers::uuid.eq(attachments::cipher_uuid)))
                .filter(ciphers::user_uuid.eq(user_uuid))
                .select(diesel::dsl::sum(attachments::file_size))
                .first(conn)
                .expect("Error loading user attachment total size");

            match result.map(|r| r.to_i64()) {
                Some(Some(r)) => r,
                Some(None) => i64::MAX,
                None => 0,
            }
        })
        .await
    }

    pub async fn count_by_user(user_uuid: &UserId, conn: &DbConn) -> i64 {
		eprintln!("[ERROR] >>> Entering count_by_user()");
        conn.run(move |conn| {
            attachments::table
                .left_join(ciphers::table.on(ciphers::uuid.eq(attachments::cipher_uuid)))
                .filter(ciphers::user_uuid.eq(user_uuid))
                .count()
                .first(conn)
                .unwrap_or(0)
        })
        .await
    }

    pub async fn size_by_org(org_uuid: &OrganizationId, conn: &DbConn) -> i64 {
		eprintln!("[ERROR] >>> Entering size_by_org()");
        conn.run(move |conn| {
            let result: Option<BigDecimal> = attachments::table
                .left_join(ciphers::table.on(ciphers::uuid.eq(attachments::cipher_uuid)))
                .filter(ciphers::organization_uuid.eq(org_uuid))
                .select(diesel::dsl::sum(attachments::file_size))
                .first(conn)
                .expect("Error loading user attachment total size");

            match result.map(|r| r.to_i64()) {
                Some(Some(r)) => r,
                Some(None) => i64::MAX,
                None => 0,
            }
        })
        .await
    }

    pub async fn count_by_org(org_uuid: &OrganizationId, conn: &DbConn) -> i64 {
		eprintln!("[ERROR] >>> Entering count_by_org()");
        conn.run(move |conn| {
            attachments::table
                .left_join(ciphers::table.on(ciphers::uuid.eq(attachments::cipher_uuid)))
                .filter(ciphers::organization_uuid.eq(org_uuid))
                .count()
                .first(conn)
                .unwrap_or(0)
        })
        .await
    }

    // This will return all attachments linked to the user or org
    // There is no filtering done here if the user actually has access!
    // It is used to speed up the sync process, and the matching is done in a different part.
    pub async fn find_all_by_user_and_orgs(
        user_uuid: &UserId,
        org_uuids: &Vec<OrganizationId>,
        conn: &DbConn,
    ) -> Vec<Self> {
        conn.run(move |conn| {
            attachments::table
                .left_join(ciphers::table.on(ciphers::uuid.eq(attachments::cipher_uuid)))
                .filter(ciphers::user_uuid.eq(user_uuid))
                .or_filter(ciphers::organization_uuid.eq_any(org_uuids))
                .select(attachments::all_columns)
                .load::<Self>(conn)
                .expect("Error loading attachments")
        })
        .await
    }
}

#[derive(
    Clone,
    Debug,
    AsRef,
    Deref,
    DieselNewType,
    Display,
    FromForm,
    Hash,
    PartialEq,
    Eq,
    Serialize,
    Deserialize,
    IdFromParam,
)]
pub struct AttachmentId(pub String);
