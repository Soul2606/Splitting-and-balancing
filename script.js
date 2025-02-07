

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
		if (this.oscillation) {
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_a)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_b)
		}else{
			failed = !this.input_dlvt_a.set_target(this.output_dlvt_b)
			failed = !this.input_dlvt_b.set_target(this.output_dlvt_a)
		}
		if (failed) {
			throw new Error("failed to configure new targets:", this);
			
		}
		this.oscillation = !this.oscillation
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






const start_dlvt_1 = new Doubly_linked_variable_transporter('A')
const start_dlvt_2 = new Doubly_linked_variable_transporter('B')

const end_dlvt_1 = new Doubly_linked_variable_transporter('')
const end_dlvt_2 = new Doubly_linked_variable_transporter('')

const balancer = create_balancer()

start_dlvt_1.set_target(balancer.input_dlvt_a)
start_dlvt_2.set_target(balancer.input_dlvt_b)

balancer.output_dlvt_a.set_target(end_dlvt_1)
balancer.output_dlvt_b.set_target(end_dlvt_2)



console.log(start_dlvt_1.prepare_transfer())
console.log(start_dlvt_2.prepare_transfer())
