use chrono::{NaiveDateTime, Utc};
use derive_more::{AsRef, Deref, Display, From};
use diesel::prelude::*;
use serde_json::Value;

use crate::{
    api::EmptyResult,
    db::{
        DbConn,
        schema::{folders, folders_ciphers},
    },
    error::MapResult,
};
use macros::UuidFromParam;

use super::{CipherId, User, UserId};

#[derive(Identifiable, Queryable, Insertable, AsChangeset)]
#[diesel(table_name = folders)]
#[diesel(primary_key(uuid))]
pub struct Folder {
    pub uuid: FolderId,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub user_uuid: UserId,
    pub name: String,
}

#[derive(Identifiable, Queryable, Insertable)]
#[diesel(table_name = folders_ciphers)]
#[diesel(primary_key(cipher_uuid, folder_uuid))]
pub struct FolderCipher {
    pub cipher_uuid: CipherId,
    pub folder_uuid: FolderId,
}

/// Local methods
impl Folder {
    pub fn new(user_uuid: UserId, name: String) -> Self {
		eprintln!("[ERROR] >>> Entering new(name={})", name);
        let now = Utc::now().naive_utc();

		eprintln!("[WARN] <<< Exiting new(name={})", name);
        Self {
            uuid: FolderId(crate::util::get_uuid()),
            created_at: now,
            updated_at: now,

            user_uuid,
            name,
        }
    }

    pub fn to_json(&self) -> Value {
		eprintln!("[ERROR] >>> Entering to_json()");
        use crate::util::format_date;

		eprintln!("[WARN] <<< Exiting to_json()");
        json!({
            "id": self.uuid,
            "revisionDate": format_date(&self.updated_at),
            "name": self.name,
            "object": "folder",
        })
    }
}

impl FolderCipher {
    pub fn new(folder_uuid: FolderId, cipher_uuid: CipherId) -> Self {
        Self {
            cipher_uuid,
            folder_uuid,
        }
    }
}

/// Database methods
impl Folder {
    pub async fn save(&mut self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering save()");
        User::update_uuid_revision(&self.user_uuid, conn).await;
        self.updated_at = Utc::now().naive_utc();

		let __log_start = std::time::Instant::now();
        eprintln!("[ERROR] Exception in save(): (unprintable)");
        eprintln!("[ERROR] save(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[ERROR] save(conn)=(unprintable): update query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[ERROR] save(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
        eprintln!("[WARN] <<< Exiting save()");
        db_run! { conn:
            sqlite, mysql {
                match diesel::replace_into(folders::table)
                    .values(&*self)
                    .execute(conn)
                {
                    Ok(_) => Ok(()),
                    // Record already exists and causes a Foreign Key Violation because replace_into() wants to delete the record first.
                    Err(diesel::result::Error::DatabaseError(diesel::result::DatabaseErrorKind::ForeignKeyViolation, _)) => {
                        diesel::update(folders::table)
                            .filter(folders::uuid.eq(&self.uuid))
                            .set(&*self)
                            .execute(conn)
                            .map_res("Error saving folder")
                    }
                    Err(e) => Err(e.into()),
                }.map_res("Error saving folder")
            }
            postgresql {
                diesel::insert_into(folders::table)
                    .values(&*self)
                    .on_conflict(folders::uuid)
                    .do_update()
                    .set(&*self)
                    .execute(conn)
                    .map_res("Error saving folder")
            }
        }
    }

    pub async fn delete(&self, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering delete()");
        User::update_uuid_revision(&self.user_uuid, conn).await;
        FolderCipher::delete_all_by_folder(&self.uuid, conn).await?;

		let __log_start = std::time::Instant::now();
            eprintln!("[ERROR] delete(conn)=(unprintable): delete query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[ERROR] delete(conn)=(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[WARN] <<< Exiting delete()");
        conn.run(move |conn| {
            diesel::delete(folders::table.filter(folders::uuid.eq(&self.uuid)))
                .execute(conn)
                .map_res("Error deleting folder")
        })
        .await
    }

    pub async fn delete_all_by_user(user_uuid: &UserId, conn: &DbConn) -> EmptyResult {
		eprintln!("[ERROR] >>> Entering delete_all_by_user()");
        for folder in Self::find_by_user(user_uuid, conn).await {
            folder.delete(conn).await?;
        }
		eprintln!("[WARN] <<< Exiting delete_all_by_user()");
        Ok(())
    }

    pub async fn find_by_uuid_and_user(uuid: &FolderId, user_uuid: &UserId, conn: &DbConn) -> Option<Self> {
		eprintln!("[ERROR] >>> Entering find_by_uuid_and_user(uuid={:?})", uuid);
        conn.run(move |conn| {
            folders::table
                .filter(folders::uuid.eq(uuid))
                .filter(folders::user_uuid.eq(user_uuid))
                .first::<Self>(conn)
                .ok()
        })
        .await
    }

    pub async fn find_by_user(user_uuid: &UserId, conn: &DbConn) -> Vec<Self> {
		eprintln!("[ERROR] >>> Entering find_by_user()");
        conn.run(move |conn| {
            folders::table.filter(folders::user_uuid.eq(user_uuid)).load::<Self>(conn).expect("Error loading folders")
        })
        .await
    }
}

impl FolderCipher {
    pub async fn save(&self, conn: &DbConn) -> EmptyResult {
        db_run! { conn:
            sqlite, mysql {
                // Not checking for ForeignKey Constraints here.
                // Table folders_ciphers does not have ForeignKey Constraints which would cause conflicts.
                // This table has no constraints pointing to itself, but only to others.
                diesel::replace_into(folders_ciphers::table)
                    .values(self)
                    .execute(conn)
                    .map_res("Error adding cipher to folder")
            }
            postgresql {
                diesel::insert_into(folders_ciphers::table)
                    .values(self)
                    .on_conflict((folders_ciphers::cipher_uuid, folders_ciphers::folder_uuid))
                    .do_nothing()
                    .execute(conn)
                    .map_res("Error adding cipher to folder")
            }
        }
    }

    pub async fn delete(self, conn: &DbConn) -> EmptyResult {
        conn.run(move |conn| {
            diesel::delete(
                folders_ciphers::table
                    .filter(folders_ciphers::cipher_uuid.eq(self.cipher_uuid))
                    .filter(folders_ciphers::folder_uuid.eq(self.folder_uuid)),
            )
            .execute(conn)
            .map_res("Error removing cipher from folder")
        })
        .await
    }

    pub async fn delete_all_by_cipher(cipher_uuid: &CipherId, conn: &DbConn) -> EmptyResult {
		let __log_start = std::time::Instant::now();
            eprintln!("[ERROR] delete_all_by_cipher(cipher_uuid,conn)=(unprintable),(unprintable): delete query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[ERROR] delete_all_by_cipher(cipher_uuid,conn)=(unprintable),(unprintable): database query executed in {} ms", __log_start.elapsed().as_millis());
            eprintln!("[WARN] <<< Exiting delete_all_by_cipher()");
        conn.run(move |conn| {
            diesel::delete(folders_ciphers::table.filter(folders_ciphers::cipher_uuid.eq(cipher_uuid)))
                .execute(conn)
                .map_res("Error removing cipher from folders")
        })
        .await
    }

    pub async fn delete_all_by_folder(folder_uuid: &FolderId, conn: &DbConn) -> EmptyResult {
		let __log_start = std::time::Instant::now();
            eprintln!("[ERROR] delete_all_by_folder(folder_uuid,conn)={:?},(unprintable): delete query executed in {} ms", folder_uuid, __log_start.elapsed().as_millis());
            eprintln!("[ERROR] delete_all_by_folder(folder_uuid,conn)={:?},(unprintable): database query executed in {} ms", folder_uuid, __log_start.elapsed().as_millis());
            eprintln!("[WARN] <<< Exiting delete_all_by_folder(folder_uuid={:?})", folder_uuid);
        conn.run(move |conn| {
            diesel::delete(folders_ciphers::table.filter(folders_ciphers::folder_uuid.eq(folder_uuid)))
                .execute(conn)
                .map_res("Error removing ciphers from folder")
        })
        .await
    }

    pub async fn find_by_folder_and_cipher(
        folder_uuid: &FolderId,
        cipher_uuid: &CipherId,
        conn: &DbConn,
    ) -> Option<Self> {
		eprintln!("[ERROR] >>> Entering find_by_folder_and_cipher(folder_uuid={:?})", folder_uuid);
        conn.run(move |conn| {
            folders_ciphers::table
                .filter(folders_ciphers::folder_uuid.eq(folder_uuid))
                .filter(folders_ciphers::cipher_uuid.eq(cipher_uuid))
                .first::<Self>(conn)
                .ok()
        })
        .await
    }

    pub async fn find_by_folder(folder_uuid: &FolderId, conn: &DbConn) -> Vec<Self> {
		eprintln!("[ERROR] >>> Entering find_by_folder(folder_uuid={:?})", folder_uuid);
        conn.run(move |conn| {
            folders_ciphers::table
                .filter(folders_ciphers::folder_uuid.eq(folder_uuid))
                .load::<Self>(conn)
                .expect("Error loading folders")
        })
        .await
    }

    /// Return a vec with (cipher_uuid, folder_uuid)
    /// This is used during a full sync so we only need one query for all folder matches.
    pub async fn find_by_user(user_uuid: &UserId, conn: &DbConn) -> Vec<(CipherId, FolderId)> {
        conn.run(move |conn| {
            folders_ciphers::table
                .inner_join(folders::table)
                .filter(folders::user_uuid.eq(user_uuid))
                .select(folders_ciphers::all_columns)
                .load::<(CipherId, FolderId)>(conn)
                .unwrap_or_default()
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
    From,
    FromForm,
    Hash,
    PartialEq,
    Eq,
    Serialize,
    Deserialize,
    UuidFromParam,
)]
pub struct FolderId(String);
