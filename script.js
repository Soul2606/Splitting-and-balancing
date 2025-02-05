

class Balancer{
	constructor(in_a,in_b,out_a,out_b){
		this.in_a = in_a
		this.in_b = in_b
		this.out_a = out_a
		this.out_b = out_b
	}
}


function balance(lane_a,lane_b){
	return {a:(lane_a+lane_b)/2, b:(lane_a+lane_b)/2}
}

function balance(balancers, initial_lanes){
	let consecutive_lanes = {}
	for (let i = 0; i < balancers.length; i++) {
		const element = balancers[i];
		let in_a
		let in_b
		let out_a
		let out_b
		
		Object.keys(element).forEach(key =>{
			
			const lane_string = element[key];
			console.log(lane_string)
			
			if (key === 'in_a'){
				in_a = lane_string
			}
			if (key === 'in_b'){
				in_b = lane_string
			}
			if (key === 'out_a'){
				out_a = lane_string
			}
			if (key === 'out_b'){
				out_b = lane_string
			}
			
		})
		
		console.log(in_a, in_b, out_a, out_b)
		if(initial_lanes[in_a] !== undefined && initial_lanes[in_b] !== undefined){
			let results = balance(initial_lanes[in_a], initial_lanes[in_b])
			consecutive_lanes[out_a] = results.a
			consecutive_lanes[out_b] = results.b
		}else{
			console.log(`lane ${in_a} or lane ${in_b} does not exist`)
		}
	}
	return consecutive_lanes
}

let balancers = [new Balancer('a0', 'b0', 'a1', 'b1')]

console.log(balance(balancers, {a0:1, b0:1}))