

class Balancer{
	constructor(input_dlvt_a, input_dlvt_b, output_dlvt_a, output_dlvt_b){
		this.input_dlvt_a = input_dlvt_a
		this.input_dlvt_b = input_dlvt_b
		this.output_dlvt_a = output_dlvt_a
		this.output_dlvt_b = output_dlvt_b
		this.oscillation = false
	}

	toggle_swap(){
		if (input_dlvt_a === undefined || input_dlvt_b === undefined || output_dlvt_a === undefined || output_dlvt_b === undefined) {
			throw new Error("undefined parameters in:", this);
		}
		let failed = false
		if ((this.input_dlvt_a.value === null && this.output_dlvt_a === null && this.input_dlvt_b !== null && this.output_dlvt_b !== null) || (this.input_dlvt_b.value === null && this.output_dlvt_b === null && this.input_dlvt_a !== null && this.output_dlvt_a !== null)) {
			//Cross
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
			this.oscillation = true
		}else if ((this.input_dlvt_a.value === null && this.output_dlvt_b === null && this.input_dlvt_b !== null && this.output_dlvt_a !== null) || (this.input_dlvt_b.value === null && this.output_dlvt_a === null && this.input_dlvt_a !== null && this.output_dlvt_b !== null)) {
			//Straight
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
			this.oscillation = false
		}else{
			//Random
			if (this.oscillation) {
				failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
				failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
			}else{
				failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
				failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
			}
			this.oscillation = !this.oscillation
		}
		if (failed) {
			throw new Error("failed to configure new targets:", this);
			
		}
	}

}




const dlvt_pointers = new Set()




class Doubly_linked_variable_transporter{
	constructor(value){
		this.value = value? value: null
		this.transfer_target = null
		this.targeted_by = null
		this.pending_item_to_send = null
		this.pending_send_to = null
		this.pending_receive_from = null
	}

	set_target(new_transfer_target){
		if (this.transfer_target === new_transfer_target){
			this.targeted_by = this
			return true
		}
		if (dlvt_pointers.has(new_transfer_target)) {
			console.warn('target already exists in dlvt_pointers')
			return false
		}
		if (this.transfer_target !== null) {
			this.transfer_target.targeted_by = null
			console.log('removing from dlvt_pointers:', this.transfer_target)
			dlvt_pointers.delete(this.transfer_target)
		}
		new_transfer_target.targeted_by = this
		this.transfer_target = new_transfer_target
		dlvt_pointers.add(new_transfer_target)
		return true
	}

	prepare_transfer(){

		if (this.transfer_target === undefined) {
			console.warn(this.transfer_target, ', is undefined instead of null')
		}

		if (this.transfer_target === null || this.transfer_target === undefined) {
			// Transfer can only proceed if the final SIC is empty
			if (this.value === null) {
				return {success:true, info:{termination:'hit end', self:this}}
			}else{
				return {success:false, info:{termination:'hit end', self:this}}
			}
		}

		if(this.transfer_target.pending_receive_from !== null){
			return {success:true, info:{termination:'loop', self:this}}
		}

		this.pending_item_to_send = this.value
		this.pending_send_to = this.transfer_target
		this.transfer_target.pending_receive_from = this
		const results = this.transfer_target.prepare_transfer()
		const can_transfer = results.success
		if (can_transfer) {
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
		return {success:can_transfer, info:{self:this,target:results.info}}
	}

	search_backwards(origin){
		const results_set = new Set()
		if (origin === undefined) {
			return results_set
		}
		if (this.targeted_by === origin) {
			results_set.add(this)
			return results_set
		}
		if (this.targeted_by === null) {
			results_set.add(this)
			return results_set
		}
		this.targeted_by.search_backwards(origin).forEach(item => {
			results_set.add(item)	
		})
		results_set.add(this)
		return results_set 
	}

	search(origin){
		const results_set_if_loop = new Set()
		if (origin === undefined) {
			throw new Error("search called without origin defined");
		}
		if (this.transfer_target === origin) {
			results_set_if_loop.add(this)
			return {termination:'loop',set:results_set_if_loop}
		}
		if (this.transfer_target === null) {
			//If this dlvt does not have a transfer target that means that this chain is not a loop, so we discard everything and search backwards
			console.log('searching backwards, this:', this)
			return {termination:'linear', set:this.search_backwards(this)}
		}

		const results = this.transfer_target.search(origin)
		if (results.termination === 'linear') {
			// If the chain is linear, pass the results without modifying anything
			return results
		}
		results_set_if_loop.add(this)
		results.set.forEach(item => {
			results_set_if_loop.add(item)	
		})
		return results
	}
}




function create_balancer() {
	const input_dlvt_a = new Doubly_linked_variable_transporter()
	const input_dlvt_b = new Doubly_linked_variable_transporter()
	const output_dlvt_a = new Doubly_linked_variable_transporter()
	const output_dlvt_b = new Doubly_linked_variable_transporter()
	input_dlvt_a.set_target(output_dlvt_a)
	input_dlvt_b.set_target(output_dlvt_b)
	const balancer = new Balancer(input_dlvt_a, input_dlvt_b, output_dlvt_a, output_dlvt_b)
	return {input_dlvt_a:input_dlvt_a, input_dlvt_b:input_dlvt_b, output_dlvt_a:output_dlvt_a, output_dlvt_b:output_dlvt_b, balancer:balancer}
}






const dlvt_1 = new Doubly_linked_variable_transporter('A')
const dlvt_2 = new Doubly_linked_variable_transporter('B')
const dlvt_3 = new Doubly_linked_variable_transporter('C')
const dlvt_4 = new Doubly_linked_variable_transporter('D')
const dlvt_5 = new Doubly_linked_variable_transporter('E')

dlvt_1.set_target(dlvt_2)
dlvt_2.set_target(dlvt_3)
dlvt_3.set_target(dlvt_4)
dlvt_4.set_target(dlvt_5)
//dlvt_5.set_target(dlvt_1)

console.log(dlvt_4.search(dlvt_4))

console.log('searching backwards, this:', dlvt_5)
console.log(dlvt_5.search_backwards(dlvt_5))
