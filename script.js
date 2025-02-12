


function force_overwrite_at_index(array, index, variable) {
	while (array.length < index) {
		array.push(null)
	}
	array[index] = variable
	return array
}




function force_overwrite_array_from_index(array, array_to_insert, index) {
	for (let i = index; i < array_to_insert.length + index; i++) {
		force_overwrite_at_index(array, i, array_to_insert[i])
	}
	return array
}




function tidy_array_right(array){
	for (let i = array.length - 1; i > 0; i--) {
		const element = array[i];
		if (element === null || element === undefined) {
			array.pop()
		}else{
			return array
		}
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
		let row
		if (row_index < this.grid.length) {
			row  = force_overwrite_at_index(this.grid[row_index], column_index, value)
		}else{
			row = force_overwrite_at_index([], column_index, value)
			while (this.grid.length <= row_index) {
				this.grid.push([])
			}
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

	set_elements_css_grid
}



const main_grid_data = new Grid_array([[]])




const main_grid = document.getElementById('main-grid')

const add_input_lane_button = document.getElementById('add-input-lane-button')

const add_row_button = document.getElementById('add-row-button')
const add_loop_back_button = document.getElementById('add-loop-back-button')





function grid_column_shift(shift_start, shift_end, element, min_span = 1){
	//This function is used to change the element's position on the grid and change the grid data to correlate with the elements grid position. 

	const element_column_start = Number(element.style.gridColumnStart)
	const element_column_end = Number(element.style.gridColumnEnd)
	const row_index = element.style.gridRowStart-1
	const column_start_index = element_column_start-1
	const column_end_index = element_column_end-1

	console.log('sifting',shift_start,shift_end)
	if (element_column_start + shift_start < 1 || element_column_start + shift_start >= element_column_end - (min_span - 1)) {
		console.log('cancelled condition 1')
		return
	}
	if (element_column_end + shift_end <= element_column_start + min_span - 1) {
		console.log('cancelled condition 2')
		return
	}


	if (main_grid_data.grid[row_index][column_end_index+shift_end] !== null && 
		main_grid_data.grid[row_index][column_end_index+shift_end] !== undefined) {
		console.log('cancelled condition 3')
		return		
	}
	if (main_grid_data.grid[row_index][column_start_index+shift_start] !== null && 
		main_grid_data.grid[row_index][column_start_index+shift_start] !== undefined && 
		shift_start < 0) {
		console.log('cancelled condition 4')
		return		
	}

	element.style.gridColumnStart = element_column_start + shift_start
	element.style.gridColumnEnd = element_column_end + shift_end

	if (shift_start > 0) {
		for (let i = column_start_index; i < shift_start + column_start_index; i++) {
			main_grid_data.set_forced(row_index, i, null)
		}
	}else{
		for (let i = column_start_index + shift_start; i < column_start_index; i++) {
			main_grid_data.set_forced(row_index, i, element)
		}
	}

	if (shift_end > 0) {
		for (let i = column_end_index; i < column_end_index + shift_end; i++) {
			main_grid_data.set_forced(row_index, i, element)
		}
	}else{
		for (let i = column_end_index + shift_end; i < column_end_index; i++) {
			main_grid_data.set_forced(row_index, i, null)
		}
	}
	
	console.log(main_grid_data.grid)
}




function gird_row_shift(shift, element) {
	console.log('shifting_row', shift)
	
	const element_column_start = Number(element.style.gridColumnStart)
	const element_column_end = Number(element.style.gridColumnEnd)
	const row_index = element.style.gridRowStart-1
	const column_start_index = element_column_start-1
	const column_end_index = element_column_end-1


	if (row_index + shift <= 0) {
		console.log('cancel condition 0')
		return
	}
	if (main_grid_data.grid[row_index].indexOf(element)) {
		console.log('cancel condition 1')
		return
	}
	if (main_grid_data.grid[row_index].indexOf(element) !== column_start_index) {
		console.log('cancel condition 2')
		return
	}
	if (main_grid_data.grid[row_index][column_end_index !== element]) {
		console.log('cancel condition 3')
		return
	}
	if (!main_grid_data.grid[row_index].slice(column_start_index, column_end_index).every(array_element => array_element === element)) {
		console.log('cancel condition 4')
		return		
	}

	function remove(array, element_to_remove) {
		array.forEach((array_element, index) => {
			if (array_element === element_to_remove){
				array[index] = null
			}
		})
	}

	if (main_grid_data.grid[row_index + shift].slice(column_start_index, column_end_index + 1).every(array_element => array_element === null || array_element === undefined)) {
		console.log('can shift up into row')
		force_overwrite_array_from_index(main_grid_data.grid[row_index + shift], main_grid_data.grid[row_index].slice(column_start_index, column_end_index + 1), column_start_index)
		remove(main_grid_data.grid[row_index], element)
	}else{
		console.log('cannot shift up into row. new row is created instead')
		const new_array = tidy_array_right(main_grid_data.grid[row_index].map(array_element=>{return array_element === element?element:null}))
		remove(main_grid_data.grid[row_index], element)
		main_grid_data.grid.splice(row_index + shift, 0, new_array)
	}
	element.style.gridRowStart = row_index + 1 + shift
	element.style.gridRowEnd = row_index + 2 + shift
	console.log(main_grid_data.grid)
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


	const buttons_container_center = document.createElement('div')
	buttons_container_center.className = 'adjustable-spanner-buttons-container-center'

	const button_center_up = document.createElement('div')
	button_center_up.className = 'adjustable-spanner-button'
	button_center_up.addEventListener('click', ()=>{gird_row_shift(-1, root)})
	buttons_container_center.appendChild(button_center_up)

	const button_center_down = document.createElement('div')
	button_center_down.className = 'adjustable-spanner-button'
	button_center_down.addEventListener('click', ()=>{gird_row_shift(1, root)})
	buttons_container_center.appendChild(button_center_down)


	root.appendChild(buttons_container_left)
	root.appendChild(buttons_container_center)
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
	console.log(main_grid_data.grid)
})




add_row_button.addEventListener('click', ()=>{
	const balancer_element = create_adjustable_grid_spanner(2, 'balancer')
	main_grid.appendChild(balancer_element)
	console.log(main_grid_data.grid)
})



add_loop_back_button.addEventListener('click', ()=>{
	const loop_back = create_adjustable_grid_spanner(1, 'loop-back')
	main_grid.appendChild(loop_back)
	console.log(main_grid_data.grid)
})


