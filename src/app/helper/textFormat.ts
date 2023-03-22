function fixTextFormatting(text: string) {
  // Remove spaces before and after dashes
  text = text.replace(/\s+-\s+/g, "-");

  // Remove spaces before and after commas
  text = text.replace(/\s*,\s*/g, ",");

  // Add spaces after periods if they are missing
  text = text.replace(/([^.\s])\.([^.\s])/g, "$1. $2");

  // Remove extra spaces
  text = text.replace(/\s+/g, " ");

  // Capitalize the first letter of the sentence
  text = text.replace(/^[a-z]/, function (match) {
    return match.toUpperCase();
  });

  return text;
}

export default fixTextFormatting;
