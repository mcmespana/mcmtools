-- Seed inicial de tools (idéntico al SEED_TOOLS del prototipo).
-- Sólo inserta si la tabla está vacía, así no machaca cambios reales.

INSERT INTO tools (
  id, name, tagline, description, icon, icon_bg, icon_color,
  status, featured, span_col, span_row, tint, glow,
  input_type, input_icon, output_type, output_icon, position, config
)
SELECT * FROM (VALUES
  (
    'separador_aj', 'Separador AJ',
    'parte nóminas firmadas en archivos individuales',
    'Recibe un PDF de nóminas con varios firmantes, lo desbloquea, detecta a cada persona por keywords, y genera un archivo renombrado por cada uno.',
    'scissors', '#C7B8FF', '#0A0A0A',
    'active', TRUE, 8, 2,
    'oklch(0.78 0.12 290 / 0.18)', 'oklch(0.78 0.18 290 / 0.25)',
    '.pdf', 'filePdf', '.zip', 'archive', 0,
    '{
      "trigger": "File Drop",
      "outputType": "Archivo",
      "userVars": [
        {"key":"mes","label":"Mes","type":"text","icon":"type","default":"Marzo"},
        {"key":"ano","label":"Año","type":"text","icon":"type","default":"2026"}
      ],
      "steps": [
        {"id":"unlock","title":"Decrypt PDF","icon":"lock","color":"#C7B8FF","summary":"pypdf.decrypt(auth_key)","tag":"pypdf","params":[{"label":"método","value":"pypdf.PdfReader.decrypt"},{"label":"auth_key","value":"$.secret.AJMCM_KEY"}],"expanded":false},
        {"id":"extract_text","title":"OCR · Extract Text","icon":"eye","color":"#A8FF60","summary":"escanea cada página buscando keywords","tag":"tesseract","params":[{"label":"engine","value":"tesseract-es-ESP"},{"label":"páginas","value":"all"}],"expanded":true},
        {"id":"split_by_keyword","title":"Variable Mapper","icon":"brain","color":"#FFD84A","summary":"cruza el texto con el diccionario y asigna sigla","tag":"core","params":[{"label":"fuente","value":"$.dictionary"},{"label":"modo","value":"first_match"}],"expanded":false},
        {"id":"split_pdf","title":"Split por página","icon":"scissors","color":"#7AD7FF","summary":"parte el PDF en archivos individuales","tag":"pypdf","params":[{"label":"estrategia","value":"one_per_keyword_match"}],"expanded":false},
        {"id":"rename","title":"Aplicar plantilla","icon":"type","color":"#FF9B6B","summary":"[#correlativo].Nomina [Sigla] [Mes] [Año].pdf","tag":"output","params":[{"label":"plantilla","value":"{{n}}.Nomina {{sigla}} {{mes}} {{ano}}.pdf"}],"expanded":false}
      ],
      "filenameTokens": [
        {"kind":"var","label":"#correlativo"},
        {"kind":"static","label":"."},
        {"kind":"static","label":"Nomina"},
        {"kind":"var","label":"sigla"},
        {"kind":"var","label":"mes"},
        {"kind":"var","label":"año"},
        {"kind":"static","label":".pdf"}
      ],
      "dictionary": [
        {"sigla":"LHC","fullName":"Lucía Hernández Castro","dni":"20925367-J","keywords":["LUCIA","HERNANDEZ","20925367J"],"color":"#C7B8FF"},
        {"sigla":"DSB","fullName":"David Soler Benítez","dni":"20911620-C","keywords":["DAVID","SOLER","20911620C"],"color":"#A8FF60"}
      ]
    }'::jsonb
  ),
  (
    'renombrador_ocr', 'Renombrador OCR',
    'lee facturas y las renombra por proveedor',
    'Detecta el proveedor en la cabecera de la factura y aplica una plantilla configurable.',
    'receipt', '#FFD84A', '#0A0A0A',
    'active', FALSE, 4, 1, NULL, NULL,
    '.pdf', 'filePdf', 'archivo', 'fileText', 1,
    '{"trigger":"File Drop","outputType":"Archivo","userVars":[],"steps":[],"filenameTokens":[],"dictionary":[]}'::jsonb
  ),
  (
    'merge_extractos', 'Merge Extractos',
    'une extractos bancarios mensuales en uno', '',
    'layers', '#A8FF60', '#0A0A0A',
    'idle', FALSE, 4, 1, NULL, NULL,
    '.pdf', 'filePdf', 'archivo', 'fileText', 2,
    '{"trigger":"File Drop","outputType":"Archivo","userVars":[],"steps":[],"filenameTokens":[],"dictionary":[]}'::jsonb
  ),
  (
    'tabla_csv', 'PDF a CSV',
    'extrae tablas de PDFs a hoja de cálculo', '',
    'table', '#7AD7FF', '#0A0A0A',
    'active', FALSE, 4, 1, NULL, NULL,
    '.pdf', 'filePdf', '.csv', 'table', 3,
    '{"trigger":"File Drop","outputType":".csv","userVars":[],"steps":[],"filenameTokens":[],"dictionary":[]}'::jsonb
  ),
  (
    'compresor_imgs', 'Compresor Visual',
    'reduce peso conservando calidad', '',
    'image', '#FF9B6B', '#0A0A0A',
    'idle', FALSE, 4, 1, NULL, NULL,
    'imagen', 'image', '.zip', 'archive', 4,
    '{"trigger":"File Drop","outputType":".zip","userVars":[],"steps":[],"filenameTokens":[],"dictionary":[]}'::jsonb
  ),
  (
    'lab_url', 'Lab · URL Cleaner',
    'limpia parámetros de tracking', '',
    'flask', '#FF8FB1', '#0A0A0A',
    'draft', FALSE, 4, 1, NULL, NULL,
    'URL', 'link', 'texto', 'type', 5,
    '{"trigger":"URL","outputType":"Archivo","userVars":[],"steps":[],"filenameTokens":[],"dictionary":[]}'::jsonb
  )
) AS v
WHERE NOT EXISTS (SELECT 1 FROM tools);
