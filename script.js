


function insert_at_index(array, index, variable) {
	if (index < array.length) {
		array[index] = variable
	}else{
		for (let i = array.length; i < index; i++) {
			array.push(null)
		} 
		array.push(variable)
	}
	return array
}




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
	all_dlvts.push(input_dlvt_a)
	all_dlvts.push(input_dlvt_b)
	all_dlvts.push(output_dlvt_a)
	all_dlvts.push(output_dlvt_b)
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






const start_a = new Doubly_linked_variable_transporter('A')
const start_b = new Doubly_linked_variable_transporter('B')
const end_a = new Doubly_linked_variable_transporter('')
const end_b = new Doubly_linked_variable_transporter('')
const end_c = new Doubly_linked_variable_transporter('')

const start_dlvts = [start_a, start_b]

const all_dlvts = [start_a, start_b, end_a, end_b, end_c]

const balancer_1a = create_balancer()

const balancer_2a = create_balancer()

const all_balancers = [balancer_1a, balancer_2a]

start_a.set_target(balancer_1a.input_dlvt_a)
start_b.set_target(balancer_1a.input_dlvt_b)
balancer_1a.output_dlvt_a.set_target(end_a)
balancer_1a.output_dlvt_b.set_target(balancer_2a.input_dlvt_a)
balancer_2a.output_dlvt_a.set_target(end_b)
balancer_2a.output_dlvt_b.set_target(end_c)















class Grid_array{
	constructor(rows, columns){
		if (Array.isArray(rows)) {
			this.grid = rows
		}else if(rows === undefined){
			this.grid = []
		}else if(columns === undefined){
			this.grid = [rows]
		}else if(typeof rows === 'number' && typeof columns === 'number'){
			this.grid = []
			for (let i = 0; i < rows; i++) {
			    let row = []
			    for (let j = 0; j < columns; j++) {
			        row.push(null) // Initialize with null or any default value
			    }
			    this.grid.push(row)
			}
		}else{
			this.grid = []
		}
	}

	get(row_index, column_index){
		if (row_index < this.grid.length && column_index < this.grid[row_index].length) {
			return this.grid[row_index][column_index]
		}else{
			console.warn('attempted to reach grid index thats out of bounds', row_index, column_index, Array.from(this.grid))
			return undefined
		}
	}

	get_column(column_index){
		const column = []
		for (const row of this.grid) {
			if (column_index < row.length) {
				column.push(row[column_index])
			}else{
				column.push(undefined)
			}
		}
		return column
	}

	set(row_index, column_index, value){
		if (row_index < this.grid.length && column_index < this.grid[row_index].length) {
			this.grid[row_index][column_index] = value
			return true
		}else{
			return false
		}
	}

	set_forced(row_index, column_index, value){
		if (this.set(row_index, column_index, value)) {
			return
		}
		const row = insert_at_index([], column_index, value)
		while (this.grid.length <= row_index) {
			this.grid.push([])
		}
		this.grid[row_index] = row
	}

	index_of(item){
		for (let i = 0; i < this.grid.length; i++) {
			const row = this.grid[i]
			const index_of_in_row = row.indexOf(item)
			if (index_of_in_row !== -1) {
				return [i,index_of_in_row]
			}
		}
		return -1
	}

	get_longest_row(){
		const lengths = []
		for (const row of this.grid) {
			lengths.push(row.length)
		}
		const max_length = Math.max(...lengths)
		const index_of_max_length = lengths.indexOf(max_length)
		return this.grid[index_of_max_length]
	}
}



const main_grid_data = new Grid_array([[]])




const main_grid = document.getElementById('main-grid')

const add_input_lane_button = document.getElementById('add-input-lane-button')

const add_row_button = document.getElementById('add-row-button')
const add_loop_back_button = document.getElementById('add-loop-back-button')





function grid_column_shift(shift_start, shift_end, element, min_span = 1){
	console.log('sifting',shift_start,shift_end)
	if (Number(element.style.gridColumnStart) + shift_start < 1 || Number(element.style.gridColumnStart) + shift_start >= Number(element.style.gridColumnEnd) - (min_span - 1)) {
		console.log('cancelled condition 1')
		return
	}
	if (Number(element.style.gridColumnEnd) + shift_end <= Number(element.style.gridColumnStart) + min_span - 1) {
		console.log('cancelled condition 2')
		return
	}
	element.style.gridColumnStart = Number(element.style.gridColumnStart) + shift_start
	element.style.gridColumnEnd = Number(element.style.gridColumnEnd) + shift_end
}




function create_adjustable_grid_spanner(min_span = 1, class_name = '') {
	const root = document.createElement('div')
	root.className = 'adjustable-spanner'
	root.classList.add(class_name)
	root.style.gridColumn = `${1}/${min_span+1}`


	const buttons_container_right = document.createElement('div')
	buttons_container_right.className = 'adjustable-spanner-buttons-container'

	const button_right_left = document.createElement('div')
	button_right_left.className = 'adjustable-spanner-button'
	button_right_left.addEventListener('click', ()=>{grid_column_shift(0, -1, root, min_span)})
	buttons_container_right.appendChild(button_right_left)

	const button_right_right = document.createElement('div')
	button_right_right.className = 'adjustable-spanner-button'
	button_right_right.addEventListener('click', ()=>{grid_column_shift(0, 1, root, min_span)})
	buttons_container_right.appendChild(button_right_right)


	const buttons_container_left = document.createElement('div')
	buttons_container_left.className = 'adjustable-spanner-buttons-container'

	const button_left_left = document.createElement('div')
	button_left_left.className = 'adjustable-spanner-button'
	button_left_left.addEventListener('click', ()=>{grid_column_shift(-1, 0, root, min_span)})
	buttons_container_left.appendChild(button_left_left)

	const button_left_right = document.createElement('div')
	button_left_right.className = 'adjustable-spanner-button'
	button_left_right.addEventListener('click', ()=>{grid_column_shift(1, 0, root, min_span)})
	buttons_container_left.appendChild(button_left_right)


	root.appendChild(buttons_container_left)
	root.appendChild(buttons_container_right)

	
	const row = []
	while (row.length < min_span) {
		row.push(root)
	}
	main_grid_data.grid.push(row)

	root.style.gridRow = `${main_grid_data.grid.length + 0}/${main_grid_data.grid.length + 1}`


	return root
}




add_input_lane_button.addEventListener('click', ()=>{
	const first_row = main_grid_data.grid[0]
	const new_input_lane = document.createElement('div')
	new_input_lane.className = 'input-flow-display'
	new_input_lane.style.gridColumn = `${first_row.length + 1}/${first_row.length + 2}`
	new_input_lane.style.gridRow = '1/2'
	main_grid.appendChild(new_input_lane)
	first_row.push(new_input_lane)
	console.log(main_grid_data)
})




add_row_button.addEventListener('click', ()=>{
	const balancer_element = create_adjustable_grid_spanner(2, 'balancer')
	main_grid.appendChild(balancer_element)
	console.log(main_grid_data)
})



add_loop_back_button.addEventListener('click', ()=>{
	const loop_back = create_adjustable_grid_spanner(1, 'loop-back')
	main_grid.appendChild(loop_back)
	console.log(main_grid_data)
})


