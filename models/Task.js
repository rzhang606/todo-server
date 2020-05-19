const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

mongoose.set('useFindAndModify', false); //deprecation warnings
mongoose.set('useCreateIndex', true);

//define a schema
//in mongoose, defines the shape of the documents in a certain collection
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    date: {
        type: Date,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});
taskSchema.plugin(uniqueValidator);

//id is becomes a string instead of object using 'toJSON' fun
taskSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString();
        delete returnedObject._id;
        delete returnedObject.__v;
    }
});

module.exports = mongoose.model('Task', taskSchema);