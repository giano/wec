var TestModel = require('../models/TestModel.js');

/**
 * TestController.js
 *
 * @description :: Server-side logic for managing Tests.
 */
const TestController = {

    /**
     * TestController.list()
     */
    list: function (req, res) {
        TestModel.find(function (err, Tests) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Test.',
                    error: err
                });
            }
            return res.json(Tests);
        });
    },

    /**
     * TestController.show()
     */
    show: function (req, res) {
        var id = req.params.id;
        TestModel.findOne({_id: id}, function (err, Test) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Test.',
                    error: err
                });
            }
            if (!Test) {
                return res.status(404).json({
                    message: 'No such Test'
                });
            }
            return res.json(Test);
        });
    },

    /**
     * TestController.create()
     */
    create: function (req, res) {
        var Test = new TestModel({			name : req.body.name
        });

        Test.save(function (err, Test) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when creating Test',
                    error: err
                });
            }
            return res.status(201).json(Test);
        });
    },

    /**
     * TestController.update()
     */
    update: function (req, res) {
        var id = req.params.id;
        TestModel.findOne({_id: id}, function (err, Test) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when getting Test',
                    error: err
                });
            }
            if (!Test) {
                return res.status(404).json({
                    message: 'No such Test'
                });
            }

            Test.name = req.body.name ? req.body.name : Test.name;
            Test.save(function (err, Test) {
                if (err) {
                    return res.status(500).json({
                        message: 'Error when updating Test.',
                        error: err
                    });
                }

                return res.json(Test);
            });
        });
    },

    /**
     * TestController.remove()
     */
    remove: function (req, res) {
        var id = req.params.id;
        TestModel.findByIdAndRemove(id, function (err, Test) {
            if (err) {
                return res.status(500).json({
                    message: 'Error when deleting the Test.',
                    error: err
                });
            }
            return res.status(204).json();
        });
    }
};

export default TestController;
