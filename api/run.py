from http.server import BaseHTTPRequestHandler
import json
import io
import cgi
import traceback


class handler(BaseHTTPRequestHandler):
    """
    Vercel Serverless Python Function.
    Receives: code (str), variables (JSON str), and optionally a file.
    Executes the code in a sandboxed exec() environment and returns the result.
    """

    def do_POST(self):
        try:
            content_type = self.headers.get("Content-Type", "")

            if "multipart/form-data" in content_type:
                # Parse multipart form data
                form = cgi.FieldStorage(
                    fp=self.rfile,
                    headers=self.headers,
                    environ={
                        "REQUEST_METHOD": "POST",
                        "CONTENT_TYPE": content_type,
                        "CONTENT_LENGTH": self.headers.get("Content-Length", "-1"),
                    },
                )

                code = form.getfirst("code", "")
                variables_raw = form.getfirst("variables", "{}")
                variables = json.loads(variables_raw)

                # Read uploaded files
                input_files = {}
                
                # Handling multiple 'files' fields
                if "files" in form:
                    files_field = form["files"]
                    if isinstance(files_field, list):
                        for f in files_field:
                            if f.file:
                                input_files[f.filename or "archivo.bin"] = f.file.read()
                    else:
                        if files_field.file:
                            input_files[files_field.filename or "archivo.bin"] = files_field.file.read()

                # Fallback for legacy single 'file'
                if "file" in form and form["file"].file:
                    input_files[form["file"].filename or "archivo.bin"] = form["file"].file.read()

                input_bytes = next(iter(input_files.values())) if input_files else None

            elif "application/json" in content_type:
                body_bytes = self.rfile.read(int(self.headers.get("Content-Length", 0)))
                body = json.loads(body_bytes)
                code = body.get("code", "")
                variables = body.get("variables", {})
                input_files = {}
                input_bytes = None

            else:
                self._send_json(400, {"status": "error", "message": "Unsupported Content-Type"})
                return

            # Create the sandbox (local scope for the script)
            local_scope = {
                "input_bytes": input_bytes,
                "input_files": input_files,
                "variables": variables,
                "output_file": None,
                "output_filename": "resultado.bin",
            }

            # Provide common imports in the global scope
            import_scope = {
                "__builtins__": __builtins__,
                "io": io,
                "json": json,
            }

            # Try importing common libraries
            try:
                import pypdf
                import_scope["pypdf"] = pypdf
            except ImportError:
                pass

            try:
                import csv
                import_scope["csv"] = csv
            except ImportError:
                pass

            try:
                import re
                import_scope["re"] = re
            except ImportError:
                pass

            try:
                import zipfile
                import_scope["zipfile"] = zipfile
            except ImportError:
                pass

            import contextlib
            
            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                # Execute the admin's Python code
                exec(code, import_scope, local_scope)

            stdout_output = f.getvalue()

            # Return the processed file if one was generated
            if local_scope.get("output_file"):
                output_bytes = local_scope["output_file"]
                filename = local_scope.get("output_filename", "resultado.bin")

                self.send_response(200)
                self.send_header("Content-Type", "application/octet-stream")
                self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
                self.send_header("Content-Length", str(len(output_bytes)))
                self.end_headers()

                if isinstance(output_bytes, bytes):
                    self.wfile.write(output_bytes)
                else:
                    self.wfile.write(bytes(output_bytes))
                return

            # No file output — return stdout/success message
            self._send_json(200, {
                "status": "success",
                "stdout": stdout_output,
                "message": "Ejecutado sin devolver archivo",
            })

        except Exception as e:
            tb = traceback.format_exc()
            self._send_json(500, {
                "status": "error",
                "message": str(e),
                "traceback": tb,
            })

    def _send_json(self, status_code, data):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)
