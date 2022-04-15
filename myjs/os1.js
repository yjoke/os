let main = new Vue({
    el: "#main",
    data: {
        selectOfYou: {
            value: '请选择要使用的调度算法',
            options: [{
                value: '1',
                label: '优先数调度算法'
            }, {
                value: '2',
                label: '循环轮转调度算法'
            },],
        },

        switchForPSA_value: 2,

        timeOfRR_value: 2,
        lessTime: 2,

        dialogFormVisible: false,
        form: {
            name: '',
            cpuTime: 0,
            needTime: '',
            priorityNum: '',
        },
        formLabelWidth: '130px',

        id: 1,
        exec: [],
        readyQueue: [],
        finish: [],
    },
    computed: {
        switchForPSA_flag: function() {
            return this.selectOfYou.value === '1';
        },
        timeOfRR_flag: function() {
            return this.selectOfYou.value === '2';
        },
        addPCB_showButton: function() {
            return this.selectOfYou.value === '1' || this.selectOfYou.value === '2';
        },
    },
    methods: {
        cancel: function() {
            this.flagForMsg = false;
        },
        addSubmit: function() {

            let newPCB = {
                id: this.id++,
                name: this.form.name,
                cpuTime: this.form.cpuTime,
                needTime: this.form.needTime,
                priorityNum: this.form.priorityNum,
            }

            managePCB(newPCB);

            this.form = {
                name: '',
                cpuTime: 0,
                needTime: '',
                priorityNum: '',
            }

            this.dialogFormVisible = false;
        },
        refresh: function() {
            this.exec = [];
            this.readyQueue = [];
            this.finish = [];
        },
        run:  function() {
            runCPU();
        },
    },
    watch: {
        timeOfRR_value: function() {
            this.lessTime = this.timeOfRR_value;
        },
    }
});

// cpu 运行一个时间片
function runCPU() {
    if (main.exec.length === 0) return;

    runOneTime();

    if (isFinish()) {
        toFinish();
        toExec();

        resetTime();
        return;
    }

    if (main.timeOfRR_flag) main.lessTime--;
    if (isEndTime()) circle();
}

// 时间片后移一位
function runOneTime() {
    let tmp = main.exec.pop();
    tmp.cpuTime += 1;
    tmp.needTime -= 1;
    main.exec.push(tmp);
}

// 查看是不是完成了
function isFinish() {
    return main.exec[0].needTime === 0;
}

// 当前执行完成, 调度
function toFinish() {
    main.finish.push(main.exec.pop());
}

// 为时间片轮转进行时间调度
function isEndTime() {
    if (main.lessTime !== 0) return false;

    resetTime();
    return true;
}

// 重置时间轮转
function resetTime() {
    main.lessTime = main.timeOfRR_value;
}

// 一个时间片结束, 循环
function circle() {
    if (main.exec.length === 0) toExec();

    main.readyQueue.push(main.exec.pop());
    toExec();
}

// 将就绪队列的一个移入运行态
function toExec() {
    if (main.readyQueue.length !== 0) main.exec.push(main.readyQueue.shift());
}


// 格式化进程块
function formatPCB(newPCB) {
    if (newPCB.name === '') newPCB.name = newPCB.id;

    newPCB.needTime = Number(newPCB.needTime);
    if (!newPCB.needTime) newPCB.needTime = 1;

    newPCB.priorityNum = Number(newPCB.priorityNum);
    if (!newPCB.priorityNum) newPCB.priorityNum = 1;
}

// 管理新添加的进程
function managePCB(newPCB) {
    formatPCB(newPCB);

    if (main.exec.length === 0) {
        main.exec.push(newPCB);
        return ;
    }

    if (main.switchForPSA_flag) {
        managePSA(newPCB);
    } else {
        manageRR(newPCB);
    }
}

// 处理优先数调度
function managePSA(newPCB) {
    let readyQueue = main.readyQueue;
    let tmpStack = [];

    while (readyQueue.length !== 0) {
        if (newPCB.priorityNum > readyQueue[readyQueue.length - 1].priorityNum) {
            tmpStack.push(readyQueue.pop());
        } else {
            break;
        }
    }

    readyQueue.push(newPCB);

    while (tmpStack.length !== 0) {
        readyQueue.push(tmpStack.pop());
    }

    if (main.switchForPSA_value) {
        managePSANon();
    }
}

// 处理优先数调度抢占式
function managePSANon() {
    if (main.readyQueue[0].priorityNum > main.exec[0].priorityNum) {
        main.exec.push(main.readyQueue.shift());
        main.readyQueue.unshift(main.exec.shift());
    }
}

// 处理时间片轮转调度
function manageRR(newPCB) {
    main.readyQueue.push(newPCB);
}

function checkNum(str) {
    if (str === '') return false;

    let num = Number(str);
    if (!num) return true;

    return num <= 0;
}
