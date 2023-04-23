require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { User } = require("./models/user");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, "dist")));

// Users which have income lower than $5 USD and have a car of brand “BMW” or “Mercedes”
app.get("/condition1", async function (req, res) {
	try {
		const users = await User.aggregate([
			{
				$addFields: {
					incomeNum: { $toDouble: { $substr: ["$income", 1, -1] } },
				},
			},
			{
				$match: {
					car: { $in: ["BMW", "Mercedes-Benz"] },
					incomeNum: { $gte: 5 },
				},
			},
			{
				$project: {
					incomeNum: false,
				},
			},
		]);

		return res.json(users);
	} catch (error) {
		console.error(error);
		return res.sendStatus(500);
	}
});

// Male Users which have phone price greater than 10,000
app.get("/condition2", async function (req, res) {
	try {
		const users = await User.find({ gender: "Male", phone_price: { $gt: 10000 } });
		return res.json(users);
	} catch (error) {
		console.error(error);
		return res.sendStatus(500);
	}
});

// Users whose last name starts with “M” and has a quote character length greater than 15 and email includes his/her last name
app.get("/condition3", async function (req, res) {
	try {
		const users = await User.aggregate([
			{
				$addFields: {
					last_first: { $substr: ["$last_name", 0, 1] },
					quote_length: { $strLenCP: "$quote" },
					email_includes: { $regexMatch: { input: "$email", regex: "$last_name", options: "i" } },
				},
			},
			{
				$match: {
					last_first: "M",
					quote_length: { $gt: 15 },
					email_includes: true,
				},
			},
			{
				$project: {
					last_first: false,
					quote_length: false,
					email_includes: false,
				},
			},
		]);
		return res.json(users);
	} catch (error) {
		console.error(error);
		return res.sendStatus(500);
	}
});

// Users which have a car of brand “BMW”, “Mercedes” or “Audi” and whose email does not include any digit
app.get("/condition4", async function (req, res) {
	try {
		const users = await User.find({
			car: { $in: ["BMW", "Mercedes-Benz", "Audi"] },
			email: /^[^\d]+$/,
		});
		return res.json(users);
	} catch (error) {
		console.error(error);
		return res.sendStatus(500);
	}
});

// Show the data of top 10 cities which have the highest number of users and their average income
app.get("/condition5", async function (req, res) {
	try {
		const users = await User.aggregate([
			{
				$addFields: {
					income: { $toDouble: { $substr: ["$income", 1, -1] } },
				},
			},
			{
				$group: {
					_id: "$city",
					average_income: { $avg: "$income" },
					count: { $sum: 1 },
				},
			},
			{
				$sort: {
					count: -1,
				},
			},
			{
				$limit: 10,
			},
		]);
		return res.json(users);
	} catch (error) {
		console.error(error);
		return res.sendStatus(500);
	}
});

app.use((req, res, next) => {
	res.sendFile(path.join(__dirname, "dist", "index.html"));
});

(async function () {
	await mongoose.connect(
		`mongodb+srv://${process.env.DBUser}:${process.env.DBPass}@deathcrafter.tmdy1.mongodb.net/mobilicis_assignment`
	);
	app.listen(3001, () => console.info("Server listening on port: 3001"));
})();
