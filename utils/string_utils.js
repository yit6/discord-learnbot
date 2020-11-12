function STRING_TYPECHECK(str) {
    if(typeof str !== "string") throw new Error("String Utils Error: one or more of your inputs should be a string!")
    if(str.trim() === "") throw new Error("String Utils Error: input string cannot consist of only whitespace!!!")
}

module.exports.make_question = (sentence) => {
    STRING_TYPECHECK(sentence);
    sentence = sentence.trim();

    const question_regex = /\?$/
    if(!question_regex.test(sentence)) sentence = sentence + "?";

    const FIRST_CHAR = sentence.substring(0, 1).toUpperCase();
    const REST_OF_SENTENCE = sentence.substring(1);
    sentence = FIRST_CHAR + REST_OF_SENTENCE;

    return sentence;
}