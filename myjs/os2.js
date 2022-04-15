let main = new Vue({
    el: "#main",
    data: {
        selectOfYou: {
            value: '请选择要使用的分配算法',
            options: [{
                value: '1',
                label: '首次适应算法'
            }, {
                value: '2',
                label: '最佳适应算法'
            },],
        },

        dialogTitle: '',

        dialogVisible: false,
        mallocFlag: false,
        freeFlag: false,

        form: {
            src: 0,
            size: 1,
        },
        formLabelWidth: '130px',

        id: 1,
        free: [{
            id: 0,
            src: 0,
            des: 32767,
            size: 32767,
        },],
        use: [],
    },
    computed: {
        selectFlag: function() {
            return this.selectOfYou.value !== '请选择要使用的分配算法';
        }
    },
    methods: {
        mallocM: function() {
            this.dialogVisible = true;

            this.dialogTitle = '申请内存';
            this.mallocFlag = true;
            this.freeFlag = false;
        },
        freeM: function() {
            this.dialogVisible = true;

            this.dialogTitle = '释放内存';
            this.freeFlag = true;
            this.mallocFlag = false;
        },
        refresh: function() {
            this.use = [];
            this.free = [{
                id: 0,
                src: 0,
                des: 32767,
                size: 32767,
            },];
        },
        dispose: function() {
            if (this.form.src === '') this.form.src = 0;
            if (this.form.size === '') this.form.size = 1;

            let request = {
                src: this.form.src,
                size: this.form.size,
            };

            if (manageM(request)) {
                this.dialogVisible = false;
            } else {
                this.$alert('没有这么大的内存', '错误', {
                    confirmButtonText: '确定',
                });
            }
            this.form = {src: 0, size: 1};
        }
    },
});

function manageM(request) {
    if (isMalloc()) return mallocM(request);
    else return freeM(request);
}

function isMalloc() {
    return main.mallocFlag;
}

function mallocM(request) {
    if (isFF()) return mallocFF(request);
    else return mallocBF(request);
}

function freeM(request) {
    if (isFF()) return freeFF(request);
    else return freeBF(request);
}

function isFF() {
    return main.selectOfYou.value === '1';
}

function mallocFF(request) {
    let free = main.free;

    for (let i = 0; i < free.length; i++) {
        if (free[i].size >= request.size) {
            subM(free, i, request.size, main.use);
            return true;
        }
    }

    return false;
}

function freeFF(request) {
    let use = main.use;

    let start = -1, end = -1;
    for (let i = 0; i < use.length; i++) {
        if (request.src >= use[i].src && request.src < use[i].des) {
            start = i;
            break;
        }
    }

    // 该起点不在 use 里面, 也就是要释放的内存已经释放
    if (start === -1) return true;

    for (let i = start; i < use.length; i++) {
        if (request.src + request.size > use[i].src && request.src + request.size <= use[i].des) {
            end = i;
            break;
        }
    }

    // 只处理一块
    if (start === end) {
        let tmp = use[start];

        let left = {
            id: main.id++,
            src: tmp.src,
            des: request.src,
            size: request.src - tmp.src,
        }

        let less = {
            id: main.id++,
            src: request.src,
            des: tmp.des,
            size: tmp.des - request.src,
        }

        use.splice(start, 1, left, less);
        subM(use, start + 1, request.size, main.free);
        // left 可能为 0
        if (use[start].size === 0) use.splice(start, 1);
        return true;
    }


    // 有一个区间的需要处理, 中间的块都要释放
    // 处理 end 这一块
    if (end !== -1) {
        subM(use, end, request.src + request.size - use[end].src, main.free);
    } else {
        end = use.length;
    }


    let tmpStack = [];
    while (use.length !== end) {
        tmpStack.push(use.pop());
    }

    // 从 start 开始的块, 全部都要释放
    while (use.length !== start + 1) {
        add(main.free, use.pop());
    }

    // start 所在的块
    let tmp = use.pop();

    let newFree = {
        id: main.id++,
        src: request.src,
        des: tmp.des,
        size: tmp.des - request.src,
    }

    add(main.free, newFree);

    let less = {
        id: main.id++,
        src: tmp.src,
        des: request.src,
        size: request.src - tmp.src,
    }
    if (less.size !== 0) use.push(less);

    while (tmpStack.length !== 0) {
        use.push(tmpStack.pop());
    }
    return true;
}

// free 中 第 i 个, 切 size 大小, 加到 use 中
function subM(free, i, size, use) {
    let tmpStack = [];
    while (free.length !== i) {
        tmpStack.push(free.pop());
    }

    // 要处理的一块
    let subBlock = tmpStack.pop();

    // 要用的一块
    let newUse = {
        id: main.id++,
        src: subBlock.src,
        des: subBlock.src + size,
        size: size,
    }

    add(use, newUse);

    // 还剩的部分
    let less = {
        id: main.id++,
        src: subBlock.src + size,
        des: subBlock.des,
        size: subBlock.size - size,
    }
    if (subBlock.size !== size) tmpStack.push(less);

    while (tmpStack.length !== 0) {
        free.push(tmpStack.pop());
    }

}

// 将这一块插入已分配区
function add(use, newUse) {
    let tmpStack = [];
    while (use.length !== 0) {
        if (use[use.length - 1].src < newUse.src) break;

        tmpStack.push(use.pop());
    }

    use.push(newUse);

    while (tmpStack.length !== 0) {
        use.push(tmpStack.pop());
    }

    check(use);
}

// 检查有没有能够合并的区域
function check(use) {

    for (let i = 0; i < use.length - 1; i++) {
        if (use[i].size === 0) {
            use.splice(i, 1);
            continue;
        }
        if (use[i].des === use[i + 1].src) {
            merge(use, i);
            check(use);
            return;
        }
    }
}

// 合并这个区域的这个地方
function merge(use, i) {
    let newUse = {
        id: main.id++,
        src: use[i].src,
        des: use[i + 1].des,
        size: use[i].size + use[i + 1].size,
    }
    use.splice(i, 2, newUse);
}



function sortBySrc(a, b) {
    return a.src - b.src;
}

function sortBySize(a, b) {
    return a.size - b.size;
}

function mallocBF(request) {
    return mallocFF(request);
}

function freeBF(request) {
    freeFF(request);
    main.free.sort(sortBySrc);
    check(main.free);
    main.free.sort(sortBySize);
    return true;
}
