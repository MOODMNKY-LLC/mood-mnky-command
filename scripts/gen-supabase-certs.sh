#!/usr/bin/env bash
# Generate locally-trusted TLS certs for Supabase using mkcert.
# Run once after installing mkcert. Fixes "self-signed certificate" on login.
#
# Install mkcert (one-time):
#   brew install mkcert   # macOS
#   mkcert -install
#
# Then run: ./scripts/gen-supabase-certs.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERTS_DIR="$SCRIPT_DIR/../certs"
CERT_FILE="$CERTS_DIR/supabase-cert.pem"
KEY_FILE="$CERTS_DIR/supabase-key.pem"

mkdir -p "$CERTS_DIR"

if ! command -v mkcert &> /dev/null; then
  echo "mkcert not found. Install it first:"
  echo "  brew install mkcert"
  echo "  mkcert -install"
  exit 1
fi

echo "Generating locally-trusted certs for 127.0.0.1, localhost..."
mkcert -cert-file "$CERT_FILE" -key-file "$KEY_FILE" 127.0.0.1 localhost

echo "Done. Certs written to certs/"
echo "Restart Supabase: supabase stop && supabase start"
