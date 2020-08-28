
    const templates = {

        password_reset:{
            subject: "Password Reset",
            content: "Please click the following link to reset your password. Your current password has not been changed so if you did not initiate this you can ignore it. It could mean someone has attempted to access your account however so please get in contact if you have concerns."
        },

        activate_account: {
            subject: "Activate your account",
            content: "Please click or copy and paste the following link to activate your account."
        },

        complete_registration: {
            subject: "Complete Your Registration",
            content:"Welcome to "+config.site.name+"! To complete your registration, please click or copy and paste the following link to activate to your account."
        }

    }

    module.exports = templates
