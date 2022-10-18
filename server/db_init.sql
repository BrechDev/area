CREATE TYPE provider AS ENUM ('local', 'facebook', 'google', 'azure_ad_oauth2', 'github', 'twitter');

CREATE TABLE IF NOT EXISTS users (
    uid SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    display_name TEXT NOT NULL,
    provider provider NOT NULL,
    password text,
    sessions json,
    session json,
    area json,
    UNIQUE (email, provider)
);
