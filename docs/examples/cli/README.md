### How to run bysquare in the terminal

To encode data from example.json and print it as a string in the terminal, use the following command:

```bash
npx bysquare --encode example.json
```

Make sure that path to example.json is correct and contains the data you want to encode.

If you want to display the encoded data as a QR code in the terminal, you can pipe the output of the encode command to qrcode-terminal:

```bash
npx bysquare --encode example.json | npx qrcode-terminal
```
