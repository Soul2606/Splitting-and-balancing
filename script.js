

class Balancer{
	constructor(out_a,out_b){
		this.oscillation = false // flips between true and false for every balance
		this.in_a = new Item()
		this.in_b = new Item()
		this.out_a = out_a // is an pointer
		this.out_b = out_b // is an pointer
	}

	transfer(input,output){
		if (input.value === null || output.value !== null){
			return false
		} 
		output.value = input.value
		input.value = null
		//return success 
		return true
	}

	balance(){
		function do_stuff(out, in_a, in_b, oscillation, transfer_function) {
			//Output value must be null because it must be empty to transfer
			if (out !== undefined && out.value === null) {
		
				let success = oscillation? transfer_function(in_a, out): transfer_function(in_b, out)

				if (!success) {
					//If unsuccessful try revers
					!oscillation? transfer_function(in_a, out): transfer_function(in_b, out)
				}			
			}
		}
		
		if (this.oscillation){
			do_stuff(this.out_a, this.in_a, this.in_b, this.oscillation, this.transfer)
			do_stuff(this.out_b, this.in_b, this.in_a, this.oscillation, this.transfer)
		}else{
			do_stuff(this.out_b, this.in_b, this.in_a, this.oscillation, this.transfer)
			do_stuff(this.out_a, this.in_a, this.in_b, this.oscillation, this.transfer)
		}
		this.oscillation = !this.oscillation
		return [this.out_a, this.out_b]
	}

	print(){
		return `in a:${this.in_a.value}, in b:${this.in_b.value}, out a:${this.out_a.value}, out b:${this.out_b.value}` 
	}

}



class Item{
	constructor(value){
		this.value = value? value: null
	}
}



let output_lane_a = new Item()
let output_lane_b = new Item()
let output_lane_c = new Item()


let results_lane1 = {a:0, b:0}
let results_lane2 = {a:0, b:0}
let results_lane3 = {a:0, b:0}


let balancer1 = new Balancer(output_lane_a)
let balancer2 = new Balancer(output_lane_b, output_lane_c)
balancer1.out_b = balancer2.in_a

console.log(balancer1)

for (let i = 0; i < 100; i++) {
	balancer1.in_a.value = 'a'
	balancer1.in_b.value = 'b'
	balancer1.balance()
	balancer2.balance()
	results_lane1[output_lane_a.value]++
	results_lane2[output_lane_b.value]++
	results_lane3[output_lane_b.value]++
	output_lane_a.value = null
	output_lane_b.value = null
	output_lane_c.value = null
}

console.log('lane a:',results_lane1, ' | lane b:', results_lane2, ' | lane c:', results_lane3)