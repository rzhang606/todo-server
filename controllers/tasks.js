const taskRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const User = require('../models/User');
const logger = require('../utils/logger');



const getToken = req => {
    const auth = req.get('authorization');
    if(auth && auth.toLowerCase().startsWith('bearer ')) {
        return auth.substring(7);
    }
    return null;
};



/**
 * Get
 */

//get all tasks
taskRouter.get('/', (req, res) => {
    //Retrieve using 'find' method of task model, {} looks for all
    Task
        .find({})
        .populate('user', { title: 1 })
        .then(task => {
            res.json(task);
        })
        .catch(err => {
            return logger.httpError(500, err.message, res);
        });
});

//get task by id
taskRouter.get('/:id', (req, res, next) => {
    Task
        .findById(req.params.id)
        .populate('user', { title: 1 })
        .then(task => {
            if(task) {
                res.json(task.toJSON());
            } else {
                return logger.httpError(404, 'Not Found', res);
            }
        })
        .catch( err => next(err));
});

//get info of the tasks collection
taskRouter.get('/info', (req, res) => {
    const time = new Date();
    Task.countDocuments({})
        .then(num => {
            res.send(
                `<div>
                    <p>There are ${num} tasks</p>
                    <p>${time}</p>
                </div>`
            );
        });
});



/**
 * Delete
 */

taskRouter.delete('/:id', async (req, res) => {
    Task.findByIdAndDelete(req.params.id)
        .then(result => {
            logger.info(`Deleted ${result.title} succesfully`);
            res.status(204).end();
        })
        .catch(err => {
            return logger.httpError(500, 'Could not delete', res);
        });
    
        const token = getToken(req); //grab token from client req
        //checks validity of token, and decodes token
        const decodedToken = jwt.verify(token, process.env.SECRET);
        if(!token || !decodedToken.id) {
            return logger.httpError(401, 'token missing or invalid', res);
        }
    
        const user = await User.findById(decodedToken.id);
        user.tasks = user.tasks.filter(task => task._id.toString() !== req.params.id.toString()); //object vs string
        await user.save();
});



/**
 * POST
 */
taskRouter.post('/', async (req, res, next) => {
    const body = req.body;

    const token = getToken(req); //grab token from client req
    //checks validity of token, and decodes token
    const decodedToken = jwt.verify(token, process.env.SECRET);
    if(!token || !decodedToken.id) {
        return logger.httpError(401, 'token missing or invalid', res);
    }

    const user = await User.findById(decodedToken.id);

    if(!user) {
        logger.error(`User with id ${decodedToken.id} does not exist`);
        return logger.httpError(400, 'Submitted user id does not match any records', res);
    }

    const newTask = new Task({
        title: body.title,
        date: new Date(),
        user: user._id
    });


    newTask.save()
        .then(async savedTask => {
            logger.info(`Saved ${savedTask.title} successfully`);

            //save notes in user
            user.tasks = user.tasks.concat(savedTask._id);
            await user.save();

            res.json(savedTask.toJSON());
        })
        .catch(err => next(err)); // let middleware handler this error
});



/**
 * PUT
 */
taskRouter.put('/:id', (req, res, next) => {
    const body = req.body;
    logger.info('Body: ', body);

    const updatedTask = {
        title: body.title,
    };

    Task.findByIdAndUpdate(req.params.id, updatedTask, { new: true }) //new: true gives us the updated object instead of original
        .then(updatedTask => {
            logger.info(`Updated ${updatedTask.title} successfully`);
            res.json(updatedTask.toJSON());
        })
        .catch(err => next(err));
});



module.exports = taskRouter;