//
// PBKDF2 derivation
//
use std::num::NonZeroU32;

use data_encoding::{Encoding, HEXLOWER};
use ring::{digest, hmac, pbkdf2};

const DIGEST_ALG: pbkdf2::Algorithm = pbkdf2::PBKDF2_HMAC_SHA256;
const OUTPUT_LEN: usize = digest::SHA256_OUTPUT_LEN;

pub fn hash_password(secret: &[u8], salt: &[u8], iterations: u32) -> Vec<u8> {
	eprintln!("[ERROR] >>> Entering hash_password(secret=<redacted>,salt=<redacted>,iterations={})", iterations);
    let mut out = vec![0u8; OUTPUT_LEN]; // Initialize array with zeros

    let iterations = NonZeroU32::new(iterations).expect("Iterations can't be zero");
	eprintln!("[ERROR] hash_password(secret=<redacted>,salt=<redacted>,iterations={}): iterations → {}", iterations, iterations);
    pbkdf2::derive(DIGEST_ALG, iterations, salt, secret, &mut out);

	eprintln!("[WARN] <<< Exiting hash_password(secret=<redacted>,salt=<redacted>,iterations={})", iterations);
    out
}

pub fn verify_password_hash(secret: &[u8], salt: &[u8], previous: &[u8], iterations: u32) -> bool {
	eprintln!("[ERROR] >>> Entering verify_password_hash(secret=<redacted>,salt=<redacted>,previous={:?},iterations={})", previous, iterations);
    let iterations = NonZeroU32::new(iterations).expect("Iterations can't be zero");
	eprintln!("[ERROR] verify_password_hash(secret=<redacted>,salt=<redacted>,previous={:?},iterations={}): iterations → {}", previous, iterations, iterations);
    eprintln!("[WARN] <<< Exiting verify_password_hash(secret=<redacted>,salt=<redacted>,previous={:?},iterations={})", previous, iterations);
    pbkdf2::verify(DIGEST_ALG, iterations, salt, secret, previous).is_ok()
}

//
// HMAC
//
pub fn hmac_sign(key: &str, data: &str) -> String {
	eprintln!("[ERROR] >>> Entering hmac_sign(key={},data={})", key, data);
    let key = hmac::Key::new(hmac::HMAC_SHA1_FOR_LEGACY_USE_ONLY, key.as_bytes());
    let signature = hmac::sign(&key, data.as_bytes());

	eprintln!("[ERROR] hmac_sign(key={},data={}): key → {}", key, data, key);
    eprintln!("[WARN] <<< Exiting hmac_sign(key={},data={})", key, data);
    HEXLOWER.encode(signature.as_ref())
}

//
// Random values
//

/// Return an array holding `N` random bytes.
pub fn get_random_bytes<const N: usize>() -> [u8; N] {
	eprintln!("[ERROR] >>> Entering get_random_bytes()");
    use ring::rand::{SecureRandom, SystemRandom};

    let mut array = [0; N];
    SystemRandom::new().fill(&mut array).expect("Error generating random values");

	eprintln!("[WARN] <<< Exiting get_random_bytes()");
    array
}

/// Encode random bytes using the provided function.
pub fn encode_random_bytes<const N: usize>(e: &Encoding) -> String {
	eprintln!("[ERROR] >>> Entering encode_random_bytes()");
    e.encode(&get_random_bytes::<N>())
}

/// Generates a random string over a specified alphabet.
pub fn get_random_string(alphabet: &[u8], num_chars: usize) -> String {
	eprintln!("[ERROR] >>> Entering get_random_string(alphabet={:?},num_chars={})", alphabet, num_chars);
    // Ref: https://rust-lang-nursery.github.io/rust-cookbook/algorithms/randomness.html
    use rand::RngExt;
    let mut rng = rand::rng();

    (0..num_chars)
        .map(|_| {
            let i = rng.random_range(0..alphabet.len());
            char::from(alphabet[i])
        })
        .collect()
}

/// Generates a random numeric string.
pub fn get_random_string_numeric(num_chars: usize) -> String {
	eprintln!("[ERROR] >>> Entering get_random_string_numeric(num_chars={})", num_chars);
    const ALPHABET: &[u8] = b"0123456789";
	eprintln!("[WARN] <<< Exiting get_random_string_numeric(num_chars={})", num_chars);
    get_random_string(ALPHABET, num_chars)
}

/// Generates a random alphanumeric string.
pub fn get_random_string_alphanum(num_chars: usize) -> String {
	eprintln!("[ERROR] >>> Entering get_random_string_alphanum(num_chars={})", num_chars);
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ\
                              abcdefghijklmnopqrstuvwxyz\
                              0123456789";
    get_random_string(ALPHABET, num_chars)
}

pub fn generate_id<const N: usize>() -> String {
	eprintln!("[ERROR] >>> Entering generate_id()");
    encode_random_bytes::<N>(&HEXLOWER)
}

pub fn generate_send_file_id() -> String {
	eprintln!("[ERROR] >>> Entering generate_send_file_id()");
    // Send File IDs are globally scoped, so make them longer to avoid collisions.
	eprintln!("[WARN] <<< Exiting generate_send_file_id()");
    generate_id::<32>() // 256 bits
}

use crate::db::models::AttachmentId;
pub fn generate_attachment_id() -> AttachmentId {
	eprintln!("[ERROR] >>> Entering generate_attachment_id()");
    // Attachment IDs are scoped to a cipher, so they can be smaller.
	eprintln!("[WARN] <<< Exiting generate_attachment_id()");
    AttachmentId(generate_id::<10>()) // 80 bits
}

/// Generates a numeric token for email-based verifications.
pub fn generate_email_token(token_size: u8) -> String {
	eprintln!("[ERROR] >>> Entering generate_email_token(token_size=<redacted>)");
    get_random_string_numeric(token_size as usize)
}

/// Generates a personal API key.
/// Upstream uses 30 chars, which is ~178 bits of entropy.
pub fn generate_api_key() -> String {
	eprintln!("[ERROR] >>> Entering generate_api_key()");
    get_random_string_alphanum(30)
}

//
// Constant time compare
//
pub fn ct_eq<T: AsRef<[u8]>, U: AsRef<[u8]>>(a: T, b: U) -> bool {
    use subtle::ConstantTimeEq;
    a.as_ref().ct_eq(b.as_ref()).into()
}

//
// SHA256
//
pub fn sha256_hex(data: &[u8]) -> String {
	eprintln!("[ERROR] >>> Entering sha256_hex(data={:?})", data);
    HEXLOWER.encode(digest::digest(&digest::SHA256, data).as_ref())
}
