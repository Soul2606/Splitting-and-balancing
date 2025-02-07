

class Balancer{
	constructor(out_a,out_b, name){
		this.name = name // For debug purposes
		this.oscillation = false // flips between true and false for every balance
		this.in_a = new Doubly_linked_variable_transporter(null, this)
		this.in_b = new Doubly_linked_variable_transporter(null, this)
		this.out_a = out_a // is an pointer
		this.out_b = out_b // is an pointer
	}

	transfer(input,output){

		if (input.value === null || !input instanceof Doubly_linked_variable_transporter || !output instanceof Doubly_linked_variable_transporter) {
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




const dlvt_pointers = new Set()




class Doubly_linked_variable_transporter{
	constructor(value){
		this.value = value? value: null
		this.transfer_target = null
		this.pending_item_to_send = null
		this.pending_send_to = null
		this.pending_receive_from = null
	}

	set_target(transfer_target){
		if (this.transfer_target === transfer_target){	
			return true
		}
		if (dlvt_pointers.has(transfer_target)) {
			console.warn('target already exists in dlvt_pointers')
			return false
		}
		if (this.transfer_target !== null) {
			console.log('removing from dlvt_pointers:', this.transfer_target)
			dlvt_pointers.delete(this.transfer_target)
		}
		this.transfer_target = transfer_target
		dlvt_pointers.add(transfer_target)
		return true
	}

	prepare_transfer(){
		if (this.transfer_target === undefined) {
			console.warn(this.transfer_target, ', is undefined instead of null')
		}
		if (this.transfer_target === null || this.transfer_target === undefined) {
			console.log('Hit end, path successfully formed')
			// Transfer can only proceed if the final SIC is empty
			if (this.value === null) {
				return true
			}else{
				return false
			}
		}
		if(this.transfer_target.pending_receive_from !== null){
			console.log('Hit self, loop successfully formed')
			return true
		}
		this.pending_item_to_send = this.value
		this.pending_send_to = this.transfer_target
		this.transfer_target.pending_receive_from = this
		const can_transfer = this.transfer_target.prepare_transfer()
		if (can_transfer) {
			console.log('transferring:', this.pending_item_to_send, 'to:', this.transfer_target.value)
			// This must happen first
			if (this.pending_receive_from === null) {
				this.value = null
			}
			this.transfer_target.value = this.pending_item_to_send
		}else{
			console.log('transfer failed')
		}
		this.pending_item_to_send = null
		this.pending_send_to = null
		this.pending_receive_from = null
		return can_transfer
	}

}






let dlvt_1 = new Doubly_linked_variable_transporter('A')
let dlvt_2 = new Doubly_linked_variable_transporter('B')
let dlvt_3 = new Doubly_linked_variable_transporter()

dlvt_1.set_target(dlvt_2)
dlvt_2.set_target(dlvt_3)

console.log( dlvt_1, dlvt_2, dlvt_3)

console.log(dlvt_1.prepare_transfer())

console.log( dlvt_1, dlvt_2, dlvt_3)