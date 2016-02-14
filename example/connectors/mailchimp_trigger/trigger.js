
module.exports = function (req, res, metadata, requestMetadata, triggerWorkflow) {
  
  // Respond ok
  res.status(200).json({ success: true });

  // Trigger the workflow
  triggerWorkflow(req.body);

};