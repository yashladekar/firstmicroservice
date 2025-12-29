import express from "express"
import proxy from "express-http-proxy"

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const SERVICE_URLS: { [key: string]: string } = {
    users: "http://localhost:8081",
    products: "http://localhost:8082",
    orders: "http://localhost:8083",
}
app.use("/:service", (req, res, next) => {
    const serviceUrl = SERVICE_URLS[req.params.service]
    if (serviceUrl) {
        proxy(serviceUrl)(req, res, next)
    }
    else {
        res.status(404).send("Service not found")
    }
})

app.get("/", (req, res) => {
    res.send("API Gateway is running")
}
)

const server = app.listen(8080, () => {
    console.log("Gateway is Listening to Port 8080");
});


const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.info("Server closed");
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error: unknown) => {
    console.error(error);
    exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);
