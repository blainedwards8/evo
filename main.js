let canvas, ctx;
let width = 1200;
let height = 760;
let predNum = 500;
let foodNum = 1000;

let creatures = [];
let food = [];

window.onload = init;

const {Neuron, Layer, Network} = synaptic;

class Food {
    constructor (ctx) {
        this.ctx = ctx;
        this.x = Math.random() * this.ctx.canvas.width - 10;
        this.y = Math.random() * this.ctx.canvas.height - 10;        
    }

    draw () {
        this.ctx.fillStyle = "#0F0";
        this.ctx.fillRect(this.x,this.y,10,10);
    }
}


class Creature {
    constructor (ctx, r, network, gen = 1) {
        this.gen = gen;
        this.ctx = ctx;
        this.x = Math.random() * this.ctx.canvas.width - 10;
        this.y = Math.random() * this.ctx.canvas.height - 10;
        this.r = r;
        this.direction = 0;
        this.maxViewDistance = 500;
        this.health = 1000;
        this.eaten = 0;

        const inputLayer = new Layer(3);
        const outputLayer = new Layer(5);
        outputLayer.set({
            squash: Neuron.squash.RELU
        })

        inputLayer.project(outputLayer);

        if(!network) {
            this.network = new Network({
                input: inputLayer,
                hidden: [],
                output: outputLayer
            });
        }else{
            this.network = network;
        }
    }

    static mutate(creature) {
        //copy the network
        const newNetwork = Network.fromJSON(creature.network.toJSON());

        //mutate at random
        for(let n of newNetwork.layers.input.list) {
            for(let id in n.connections.projected) {
                if(Math.random() * 100 > 99) {
                    n.connections.projected[id].weight = Math.random();
                }
            }
        }

        creatures.push(new Creature(creature.ctx, 10, newNetwork, creature.gen++))
    }

    draw() {
        this.ctx.fillStyle = this.gen == 1 ? "#F00" : this.gen == 2 ? "#00F" : this.gen == 3 ? "#746AB0" : this.gen == 4 ? "#333" : this.gen == 5 ? "#FFCE30" : "#999";
        this.ctx.fillRect(this.x,this.y,this.r,this.r);
    }

    update (food) {
        //for every other creature, determine whether in view
        // y = mx + b
        let view = [0,0,0];

        for(let f of food) {
            let posX = this.x - f.x;
            let posY = this.y - f.y;
            let distance = Math.sqrt(Math.pow(posX,2) + Math.pow(posY,2));
            let angle = this.direction - (Math.atan(posY / posX) * 360 / Math.PI);  
            if(distance < this.maxViewDistance && angle > -60 && angle < 60){
                view[0] = this.maxViewDistance / distance;
                if(angle > -30 && angle < 30) view[1] = this.maxViewDistance / distance * 2;
                if(angle > -10 && angle < 10) view[2] = 150 / this.maxViewDistance * 4;
            }

            if(distance < 5) {
                this.health = 1000;
                this.eaten++;
                if(this.eaten > 10) {
                    Creature.mutate(this);
                    this.eaten = 0;
                }
                let idx = food.findIndex(x => x == f);
                food.splice(idx,1);
            }
        }


        const results = this.network.activate(view)
        const command = results.findIndex(x => x == Math.max(...results));
        if(command == 0) {
            this.direction = 0
            this.x++;
        }

        if(command == 1) {
            this.direction = 180;
            this.x--;
        }

        if(command == 2) {
            this.direction = 90;
            this.y++;
        }

        if(command == 3) {
            this.direction = 270;
            this.y--;
        }
        this.health--;
        if(this.health <= 0) this.kill(); 

        if(this.y > height) this.y = 0;
        if(this.y < 0) this.y = height;
        if(this.x > width) this.x = 0;
        if(this.x < 0) this.x = width;
        this.draw();
    }

    kill() {
        const idx = creatures.findIndex(x => x == this);
        creatures.splice(idx, 1);
        delete this;
    }
}

function init() {
    canvas = document.querySelector("#canvas");
    ctx = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    //add in the predators
    for(let x = 0; x < predNum; x++) {
        creatures.push(new Creature(ctx, 10));
    }

    for(let x = 0; x < 1000; x++) {
        food.push(new Food(ctx));
    }

    window.requestAnimationFrame(tick);
}

function tick(ts) {
    if(Math.random() * 100 > 60) {
        food.push(new Food(ctx));
    }

    draw();
    window.requestAnimationFrame(tick);
}

function draw () {
    ctx.clearRect(0,0,width,height)

    for(let creature of creatures) {
        creature.update(food);
    }

    for(let f of food) {
        f.draw();
    }

    console.log(creatures.reduce((prev,curr) => {
        let idx = curr.gen - 1;
        prev[idx]++;
        return prev;
    }, [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]))
}
