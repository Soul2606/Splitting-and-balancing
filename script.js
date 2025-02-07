

class Balancer{
	constructor(out_a,out_b, name){
		this.name = name // For debug purposes
		this.oscillation = false // flips between true and false for every balance
		this.in_a = new Single_item_container(null, this)
		this.in_b = new Single_item_container(null, this)
		this.out_a = out_a // is an pointer
		this.out_b = out_b // is an pointer
	}

	transfer(input,output){

		if (input.value === null || !input instanceof Single_item_container || !output instanceof Single_item_container) {
			return false
		}

		if (output.value !== null){
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
		console.log(`in a:${this.in_a.value}, in b:${this.in_b.value}, out a:${this.out_a.value}, out b:${this.out_b.value}`)
	}

}




const sic_pointers = new Set()




class Single_item_container{
	constructor(value){
		this.value = value? value: null
		this.transfer_target = null
		this.pending_send_to = null
		this.pending_receive_from = null
	}

	set_target(transfer_target){
		if (this.transfer_target === transfer_target){	
			return true
		}
		if (sic_pointers.has(transfer_target)) {
			console.warn('target already exists in sic_pointers')
			return false
		}
		if (this.transfer_target !== null) {
			console.log('removing from sic_pointers:', this.transfer_target)
			sic_pointers.delete(this.transfer_target)
		}
		this.transfer_target = transfer_target
		sic_pointers.add(transfer_target)
		return true
	}
}






let output_lane_a = new Single_item_container()



let results_lane1 = {a:0, b:0}


for (let i = 0; i < 100; i++) {
	results_lane1[output_lane_a.value]++
	output_lane_a.value = null
}

console.log('lane a:',results_lane1, ' | lane b:', results_lane2, ' | lane c:', results_lane3)