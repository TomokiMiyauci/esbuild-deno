use import_map::ImportMap;
use serde::Serialize;
use std::str::FromStr;
use url::Url;
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
pub struct ParsedResult {
    pub import_map: ImportMap,
    pub warnings: Vec<String>,
}

#[wasm_bindgen(typescript_custom_section)]
const T: &'static str = r#"
export interface ParsedResult {
    import_map: {
        imports: Map<string, string | undefined>;
        scopes: Map<string, Map<string, string | undefined>>;
    };
    warnings: string[];
}
"#;

#[wasm_bindgen(js_name = parseImportMap)]
pub fn parse_import_map(input: &str, url: &str) -> Result<JsValue, JsValue> {
    let url = Url::from_str(url).map_err(|op| op.to_string())?;
    let result = import_map::parse_from_json(&url, input).map_err(|op| op.to_string())?;

    let warnings = result.diagnostics.iter().map(|v| v.to_string()).collect();
    let result = ParsedResult {
        import_map: result.import_map,
        warnings,
    };

    let value = serde_wasm_bindgen::to_value(&result)?;

    Ok(value)
}
