### Preparation steps

```bash
npm i -g bysquare
# the "qrcode-terminal" library transforms a string into qr-code picture
npm i -g qrcode-terminal
```

### Execution

```bash
npx bysquare --encode example.json | npx qrcode-terminal
```
