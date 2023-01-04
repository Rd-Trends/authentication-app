import nextConnect from "next-connect";
import { NextApiResponse } from "next";
import { NextApiReq } from "../../../interface";
import User from "../../../models/userModel";
import init from "../../../middleware/init";
import isEmail from "validator/lib/isEmail";
import normalizeEmail from "validator/lib/normalizeEmail";
import bcrypt from "bcrypt";

const handler = nextConnect();

handler.use(init);

handler.post(async (req: NextApiReq, res: NextApiResponse, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Missing Field(s)." });
    }

    if (!isEmail(email)) {
      res.status(400).json({ message: "The email you entered is invalid." });
      return;
    }

    const userExists = await User.exists({ email });

    if (userExists) {
      return res
        .status(403)
        .json({ message: "The email has already been used." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email: normalizeEmail(email),
      password: hashedPassword,
      photo: "",
      name: "",
      bio: "",
      phone: "",
    });

    await user.save();
    req.login(
      {
        name: user.name,
        email: user.email,
        phone: user.phone,
        _id: user._id,
        photo: user.photo,
        bio: user.bio,
      },
      (err) => {
        if (err) return next(err);
        return res.status(201).json(req.user);
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "an error occured" });
  }
});

export default handler;