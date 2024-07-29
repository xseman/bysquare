function getProducedString(iban, amount, variable) {
	return `IBAN: ${iban}, Amount: ${amount}, Variable: ${variable}`;
}


function initializeForm() {
	const amountInput = document.querySelector('input[name="amount"]');
	const ibanInput = document.querySelector('input[name="iban"]');
	const variableInput = document.querySelector('input[name="variable"]');
	const producedStringInput = document.querySelector('input[name="producedString"]');

	amountInput.value = '100';
	ibanInput.value = 'SK9611000000002918599669';
	variableInput.value = '123';

	producedStringInput.value = getProducedString(ibanInput.value, amountInput.value, variableInput.value);

	function updateProducedString() {
		producedStringInput.value = getProducedString(ibanInput.value, amountInput.value, variableInput.value);
	}

	amountInput.addEventListener('input', updateProducedString);
	ibanInput.addEventListener('input', updateProducedString);
	variableInput.addEventListener('input', updateProducedString);
}

window.addEventListener('load', initializeForm);
