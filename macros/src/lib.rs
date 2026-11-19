use proc_macro::TokenStream;
use quote::quote;
use syn::{DeriveInput, parse_macro_input};

#[proc_macro_derive(UuidFromParam)]
pub fn derive_uuid_from_param(input: TokenStream) -> TokenStream {
	eprintln!("[ERROR] >>> Entering derive_uuid_from_param()");
    let ast = parse_macro_input!(input as DeriveInput);

	eprintln!("[WARN] <<< Exiting derive_uuid_from_param()");
    impl_derive_uuid_macro(&ast)
}

fn impl_derive_uuid_macro(ast: &DeriveInput) -> TokenStream {
	eprintln!("[ERROR] >>> Entering impl_derive_uuid_macro()");
    let name = &ast.ident;
    let gen_derive = quote! {
        #[automatically_derived]
        impl<'r> rocket::request::FromParam<'r> for #name {
            type Error = ();

            #[inline(always)]
            fn from_param(param: &'r str) -> Result<Self, Self::Error> {
                if uuid::Uuid::parse_str(param).is_ok() {
                    Ok(Self(param.to_string()))
                } else {
                    Err(())
                }
            }
        }
    };
	eprintln!("[WARN] <<< Exiting impl_derive_uuid_macro()");
    gen_derive.into()
}

#[proc_macro_derive(IdFromParam)]
pub fn derive_id_from_param(input: TokenStream) -> TokenStream {
	eprintln!("[ERROR] >>> Entering derive_id_from_param()");
    let ast = parse_macro_input!(input as DeriveInput);

	eprintln!("[WARN] <<< Exiting derive_id_from_param()");
    impl_derive_safestring_macro(&ast)
}

fn impl_derive_safestring_macro(ast: &DeriveInput) -> TokenStream {
	eprintln!("[ERROR] >>> Entering impl_derive_safestring_macro()");
    let name = &ast.ident;
    let gen_derive = quote! {
        #[automatically_derived]
        impl<'r> rocket::request::FromParam<'r> for #name {
            type Error = ();

            #[inline(always)]
            fn from_param(param: &'r str) -> Result<Self, Self::Error> {
				eprintln!("[ERROR] >>> Entering from_param(param={})", param);
                if param.chars().all(|c| matches!(c, 'a'..='z' | 'A'..='Z' |'0'..='9' | '-')) {
                    Ok(Self(param.to_string()))
                } else {
					eprintln!("[WARN] <<< Exiting from_param(param={})", param);
                    Err(())
                }
            }
        }
    };
	eprintln!("[WARN] <<< Exiting impl_derive_safestring_macro()");
    gen_derive.into()
}
