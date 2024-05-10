export module WebUtils {
	/**
	 * Will get the content of cookie with name cookieName
	 * @param cookieName Name of cookie
	 * @returns Content
	 */
	export function GetCookie(cookieName: string): string {
		let name = cookieName + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(";");

		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	/**
	 * Will set the content of a cookie
	 * @param cookieName Cookie name
	 * @param cookieValue Cookie value
	 * @param daysToLast How long the cookie should be valid
	 */
	export function SetCookie(
		cookieName: string,
		cookieValue: string,
		daysToLast: number = 365
	) {
		const d = new Date();
		d.setTime(d.getTime() + daysToLast * 24 * 60 * 60 * 1000);
		let expires = "expires=" + d.toUTCString();
		document.cookie = cookieName + "=" + cookieValue + ";" + expires;
	}

	/**
	 * Delete cookie
	 * @param cookieName Cookie name
	 */
	export function DeleteCookie(cookieName: string) {
		document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 UTC";
	}

	/**
	 * Will start a download of a file with filename and content text
	 * @param filename File name
	 * @param text Content
	 */
	export function DownloadFile(filename, text) {
		let element = document.createElement("a");
		element.setAttribute(
			"href",
			"data:text/plain;charset=utf-8," + encodeURIComponent(text)
		);
		element.setAttribute("download", filename);

		element.style.display = "none";
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}

	/**
	 * Will download a file that exists on URL filepath, for example a resource file
	 * @param filepath File path
	 * @param filename File name
	 */
	export function DownloadExistingFile(filepath: string, filename: string) {
		let element = document.createElement("a");
		element.setAttribute(
			"href",
			filepath
		);
		element.setAttribute("download", filename);

		element.style.display = "none";
		document.body.appendChild(element);

		element.click();

		document.body.removeChild(element);
	}
}
