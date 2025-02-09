

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
		//Random
		if (this.oscillation) {
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
		}else{
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
		}
		this.oscillation = !this.oscillation
		if (failed) {
			throw new Error("failed to configure new targets:", this);
			
		}
	}

	push_to_empty_outputs(){
		//This function exists to essentially give a buffer for one dlvt, if input stops for only one cycle, then the flow will still be continuous
		if (input_dlvt_a === undefined || input_dlvt_b === undefined || output_dlvt_a === undefined || output_dlvt_b === undefined) {
			throw new Error("undefined parameters in:", this);
		}

		// If only one non empty input has only one empty output available: reconfigure targets so that a transfer is guaranteed to happen
		let failed = false
		const input_a_empty = this.input_dlvt_a === null
		const input_b_empty = this.input_dlvt_b === null
		const output_a_empty = this.output_dlvt_a === null
		const output_b_empty = this.output_dlvt_b === null

		if ((input_a_empty && !input_b_empty && output_a_empty && !output_b_empty) || 
		(!input_a_empty && input_b_empty && !output_a_empty && output_b_empty)) {
			//Cross
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
			this.oscillation = true
		}else if ((input_a_empty && !input_b_empty && !output_a_empty && output_b_empty) || 
		(!input_a_empty && input_b_empty && output_a_empty && !output_b_empty)) {
			//Straight
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
			this.oscillation = false
		}
		// If both these conditions fail then keep targets as is (random)
		this.input_dlvt_a.transfer()
		this.input_dlvt_b.transfer()
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
		if (new_transfer_target.targeted_by !== null) {
			throw new Error("This DLVT is already targeted by another DLVT");
		}
		new_transfer_target.targeted_by = this
		this.transfer_target = new_transfer_target
		dlvt_pointers.add(new_transfer_target)
		return true
	}

	transfer(){
		if (this.transfer_target === null) {
			return false
		}
		if (this.transfer_target.value !== null) {
			return false
		}
		if (this.transfer_target === this) {
			return true
		}
		this.transfer_target.value = this.value
		this.value = null
		return true
	}

	transfer_recursively(){

		if (this.transfer_target === undefined) {
			console.warn(this.transfer_target, ', is undefined instead of null')
		}

		if (this.transfer_target === null || this.transfer_target === undefined) {
			// Transfer can only proceed if the final DLVT is empty
			if (this.value === null) {
				return {success:true, info:{termination:'hit end', chain:[{reference:this, success:true}]}}
			}else{
				return {success:false, info:{termination:'hit end', chain:[{reference:this, success:false}]}}
			}
		}

		if(this.transfer_target.pending_receive_from !== null){
			// when a loop is detected the chain must start empty
			return {success:true, info:{termination:'loop', chain:[]}}
		}

		this.pending_item_to_send = this.value
		this.pending_send_to = this.transfer_target
		this.transfer_target.pending_receive_from = this
		const results = this.transfer_target.transfer_recursively()
		const can_transfer = results.success || this.transfer_target.value === null
		if (can_transfer) {
			// This must happen first
			if (this.pending_receive_from === null) {
				this.value = null
			}
			this.transfer_target.value = this.pending_item_to_send
		}
		this.pending_item_to_send = null
		this.pending_send_to = null
		this.pending_receive_from = null
		results.info.chain.unshift({reference:this, success:can_transfer})
		results.success = can_transfer
		return results
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
			return {termination:'loop', set:results_set_if_loop}
		}
		if (this.transfer_target === null) {
			//If this dlvt does not have a transfer target that means that this chain is not a loop, so we discard everything and search backwards
			return {termination:'linear', set:this.search_backwards(this)}
		}

		const results = this.transfer_target.search(origin)
		if (results.termination === 'linear') {
			// If the chain is linear, pass the results without modifying anything
			return results
		}
		results.set.add(this)
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




function execute_transfer_on_all_dlvt_chains(all_dlvts){
	const all_transfers_info = []
	const unexecuted_dlvts = Array.from(all_dlvts)
	let failsafe = 1000

	while (unexecuted_dlvts.length > 0 && failsafe > 0) {
		const transfer_info = unexecuted_dlvts[0].transfer_recursively()
		all_transfers_info.push(transfer_info)
		const dlvt_chain_array = transfer_info.info.chain
		for (let i = 0; i < dlvt_chain_array.length; i++) {
			const dlvt_in_chain = dlvt_chain_array[i].reference;
			const index_to_remove = unexecuted_dlvts.indexOf(dlvt_in_chain)
			if (index_to_remove !== -1) {
				unexecuted_dlvts.splice(index_to_remove, 1)
			}
			if (all_dlvts.indexOf(dlvt_in_chain) === -1) {
				console.warn('found a dlvt in transfer chain that is not in all_dlvts:', dlvt_in_chain)
			}
		}
		failsafe -= 1
	}
	if (failsafe <= 0) {
		console.warn('failsafe triggered')
	}
	return all_transfers_info
}






const dlvt_1a = new Doubly_linked_variable_transporter('A')
const dlvt_1b = new Doubly_linked_variable_transporter('B')
const dlvt_2a = new Doubly_linked_variable_transporter('')
const dlvt_2b = new Doubly_linked_variable_transporter('')

const all_dlvts = [dlvt_1a, dlvt_1b, dlvt_2a, dlvt_2b]

const balancer_1a = create_balancer()

all_dlvts.push(balancer_1a.input_dlvt_a)
all_dlvts.push(balancer_1a.input_dlvt_b)
all_dlvts.push(balancer_1a.output_dlvt_a)
all_dlvts.push(balancer_1a.output_dlvt_b)

dlvt_1a.set_target(balancer_1a.input_dlvt_a)
dlvt_1b.set_target(balancer_1a.input_dlvt_b)
balancer_1a.output_dlvt_a.set_target(dlvt_2a)
balancer_1a.output_dlvt_b.set_target(dlvt_2b)

console.log(execute_transfer_on_all_dlvt_chains(all_dlvts))

