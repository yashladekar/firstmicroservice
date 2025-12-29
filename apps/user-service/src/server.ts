import express, { Express } from "express"
import { Server } from "http"
import { errorConverter, errorHandler } from "./middleware"
import { connectDB } from "./database"
import config from "./config/config"
import { rabbitMQService } from "./services/rabbitmq.service"
import userRouter from "./routes/authRoutes";
const app: Express = express()

let server: Server

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(userRouter)
app.use(errorConverter)
app.use(errorHandler)

connectDB()
    .then(() => {
        server = app.listen(config.PORT, () => {
            console.log(`Server is running on port ${config.PORT}`)
        })

        rabbitMQService
            .init()
            .then(() => {
                console.log("Connected to RabbitMQ successfully")
            })
            .catch((error: Error) => {
                console.error("Failed to connect to RabbitMQ:", error)
            })
    })
    .catch((error: Error) => {
        console.error("Database connection failed:", error)
    })

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason)
    if (server) {
        server.close(() => {
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
})