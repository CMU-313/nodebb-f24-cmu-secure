var request = require("request");

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	// Edit the translator URL below
	// const TRANSLATOR_API = "https://nodebb-f24-translator.azurewebsites.net/";
	console.log("Inside translate");
	const TRANSLATOR_API =
		"https://translator-cmu-secure-bfg0aya6fsgjcrd3.canadacentral-01.azurewebsites.net/";
	const response = await fetch(
		TRANSLATOR_API + "/?content=" + postData.content,
	);
	console.log(postData.content);
	const data = await response.json();
	console.log(data);
	return [data["is_english"], data["translated_content"]];
};
