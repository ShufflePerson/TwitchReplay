

export default ((input: string, max_size: number = 30) => {
    if (input.length > max_size) {
        return input.substring(0, max_size) + "...";
    } else {
        return input;
    }
})