let io = null;

const setIO = (socketIO) => {
    io = socketIO;
};

const emitAlert = (alert) => {
    if (io) io.emit('new_alert', alert);
};

const emitSessionTerminated = (data) => {
    if (io) io.emit('session_terminated', data);
};

const emitSystemStatus = (status) => {
    if (io) io.emit('system_status_update', status);
};

const emitAttackSimulation = (event) => {
    if (io) io.emit('attack_simulation_event', event);
};

const emitRiskScoreUpdate = (data) => {
    if (io) io.emit('risk_score_update', data);
};

const emitDemoEvent = (event) => {
    if (io) io.emit('demo_event', event);
};

const broadcastToRoom = (room, event, data) => {
    if (io) io.to(room).emit(event, data);
};

module.exports = {
    setIO, emitAlert, emitSessionTerminated, emitSystemStatus,
    emitAttackSimulation, emitRiskScoreUpdate, emitDemoEvent, broadcastToRoom,
};
