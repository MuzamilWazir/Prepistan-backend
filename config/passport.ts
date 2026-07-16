import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import { User } from "../model/user.model.js";

export function configurePassport() {
  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // ── Local Strategy (email/password) ──
  passport.use(
    "local-login",
    new (await import("passport-local")).Strategy(
      { usernameField: "email", passwordField: "password" },
      async (email: string, password: string, done) => {
        try {
          const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
          if (!user) return done(null, false, { message: "Invalid credentials" });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return done(null, false, { message: "Invalid credentials" });

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // ── Google OAuth Strategy ──
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/dashboard";

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "/api/auth/google/callback",
        proxy: true,
      },
      async (_accessToken: string, _refreshToken: string, profile: any, done: any) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error("No email found from Google"), undefined);

          let user = await User.findOne({ email: email.toLowerCase() });

          if (user) {
            // Update provider if it was Email
            if (user.provider === "Email") {
              user.provider = "Google";
              user.avatarUrl = user.avatarUrl || profile.photos?.[0]?.value || "";
              await user.save();
            }
          } else {
            // Create new user from Google profile
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-16), 10);
            user = new User({
              name: profile.displayName || email.split("@")[0],
              email: email.toLowerCase(),
              password: randomPassword,
              role: "Student",
              provider: "Google",
              avatarUrl: profile.photos?.[0]?.value || "",
              xp: 0,
              coins: 0,
              streak: 0,
              longestStreak: 0,
              level: 1,
              isPremium: false,
            });
            await user.save();
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  return passport;
}
