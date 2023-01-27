

export default (() => {
    if (process.env.ENVIRONMENT === "development") return true;
})