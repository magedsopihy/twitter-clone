const mongoose = require('mongoose')


const notificationSchema = new mongoose.Schema({
    userTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true })


notificationSchema.statics.insertNotifications = async (userTo, userFrom, notificationType, entityId) => {
    const data = {
        userTo,
        userFrom,
        notificationType,
        entityId
    }

    try {
        await Notification.deleteOne(data)
    } catch (e) {
        console.log(e)
    }   
       if(userTo == userFrom) return
    return Notification.create(data)
}
const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification


