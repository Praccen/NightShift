export module Utils {
	export function getRandomInt(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	export function generateUniqueRandomNumbers(count: number, min: number, max: number): number[] {
		const uniqueNumbers: number[] = [];

		while (uniqueNumbers.length < count) {
			const randomNum = getRandomInt(min, max);
			if (!uniqueNumbers.includes(randomNum)) {
				uniqueNumbers.push(randomNum);
			}
		}

		return uniqueNumbers;
	}
}
