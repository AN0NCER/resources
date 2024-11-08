export default async () => {
    console.log("Run update v2.6.5");
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("success");
        }, 1000);
    });
};