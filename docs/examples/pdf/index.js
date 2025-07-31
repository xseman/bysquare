import { decode } from "https://esm.sh/bysquare@latest";
import jsQR from "https://esm.sh/jsqr@latest";
import {
	getDocument,
	GlobalWorkerOptions,
} from "https://esm.sh/pdfjs-dist@latest";

GlobalWorkerOptions.workerSrc = "https://esm.sh/pdfjs-dist@latest/build/pdf.worker.js";

class PDFQRExtractor {
	constructor(element) {
		this.appElement = element;
		this._createUI();
		this.fileInput.addEventListener("change", this._handleFileChange);
	}

	_createUI() {
		this.fileInput = document.createElement("input");
		this.fileInput.type = "file";
		this.fileInput.id = "fileInput";
		this.fileInput.accept = "application/pdf";

		this.outputElement = document.createElement("div");
		this.outputElement.id = "output";

		this.appElement.appendChild(this.fileInput);
		this.appElement.appendChild(this.outputElement);
	}

	_handleFileChange = async (event) => {
		const file = event.target.files[0];

		if (!file) {
			this._renderOutputData({ error: "No file selected." });
			return;
		}

		const pdfBuffer = await this._readFileToArrayBuffer(file);
		const pdfDocument = await getDocument(pdfBuffer).promise;
		const page = await pdfDocument.getPage(1);

		const viewport = page.getViewport({ scale: 1.5 });
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");

		canvas.width = viewport.width;
		canvas.height = viewport.height;

		await page.render({
			canvasContext: context,
			viewport: viewport,
		}).promise;

		const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
		const qrCode = jsQR(imageData.data, canvas.width, canvas.height);

		if (!qrCode) {
			this._renderOutputData({ error: "No QR Code found." });
			return;
		}

		const parsedData = decode(qrCode.data);
		this._renderOutputData(parsedData);
	};

	_readFileToArrayBuffer(file) {
		return new Promise((resolve, reject) => {
			const fileReader = new FileReader();
			fileReader.onload = () => resolve(new Uint8Array(fileReader.result));
			fileReader.onerror = reject;
			fileReader.readAsArrayBuffer(file);
		});
	}

	_renderOutputData(data) {
		this.outputElement.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const appElement = document.querySelector("#app");
	new PDFQRExtractor(appElement);
});
