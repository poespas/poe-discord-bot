const db = require("../Database");

let Profile = { };

Profile.GetUser = async (userid) => {
    let resp = 
        await db('users')
            .where({ userid })
            .first();

    if (!resp) {
        return null;
    }

    return resp;
};

Profile.SetUser = async (userid) => {
    let resp = 
        await db('users')
            .insert({
                userid
            })
            .onConflict("userid")
            .merge();

    if (resp.length === 0) {
        return null;
    }

    return resp[0];
};

Profile.SetOption = async (userid, option_key, option_value) => {
    return await db("user_options")
        .insert({
            userid,
            option_key,
            option_value
        })
        .onConflict("userid")
        .merge();
}

module.exports = Profile;