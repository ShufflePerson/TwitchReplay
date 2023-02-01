

export default ((val: number, target: number, tolerance: number): boolean => {
    return (val >= target - tolerance && val <= target + tolerance);
})