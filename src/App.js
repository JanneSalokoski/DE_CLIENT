import React from 'react';
import { nanoid, customAlphabet } from 'nanoid';

const config = {
	url: 'ws://localhost:3000',
	clientID: nanoid(10),
};


const StatusLine = (props) => {
	return (
		<div className='StatusLine'>
			<h2>Status</h2>
			<div className={`StatusItem ${props.connected}`} id='connected'>
				Connected to server: {props.connected ? 'yes' : 'no'}
			</div>
			<div className={`StatusItem`} id='connectionID'>
				ConnectionID: {props.connectionID}
			</div>
			<div className={`StatusItem ${props.clientRegistered}`} id='voterRegistered'>
				Connected to host: {props.hostID}
			</div>
			<div className={`StatusItem ${props.voterRegistered}`} id='voterRegistered'>
				Registered as voter: {props.voterRegistered ? 'yes' : 'no'}
			</div>
			<div className={`StatusItem`} id='voterID'>
				VoterID: {props.voterID}
			</div>
			<div className={`StatusItem ${props.voteStatus}`} id='voteStatus'>
				Vote given: {props.voteStatus ? 'yes' : 'no'}
			</div>
			<div className={`StatusItem ${props.electionStatus}`} id='electionStatus'>
				Election: {props.electionStatus}
			</div>
		</div>
	);
}

const ConnectionView = (props) => {
	const [hostID, setHostID] = React.useState('');

	return (
		<div className='ConnectionView'>
			<h2>Connect to a host</h2>
			<form onSubmit={(event) => {
				event.preventDefault();
				props.handleSubmit(hostID);
			}}>
				<label htmlFor='hostID'>Host ID: </label>
				<input type='text' id='hostID'
					value={hostID}
					onChange={(event) => setHostID(event.target.value)}
				/>
				<input type='submit' value='Submit!' />
			</form>
		</div>
	);
}

const VoterRegistration = (props) => {
	const [newVoterName, setNewVoterName] = React.useState("");

	return (
		<div className='VoterRegistration'>
			<h2>Register as a voter</h2>
			<label>Name: </label>
			<input type="text"
				value={newVoterName}
				onChange={(event) => setNewVoterName(event.target.value)}
			/>
			<input type='button'
				value='Submit!'
				onClick={(event) => props.handleSubmit(newVoterName)}
			/>
		</div>
	);
}

const VoteInterface = (props) => {
	const [selectedOption, setSelectedOption] = React.useState("");

	function generateCandidateItems(candidates) {
		console.log(candidates);
		return candidates.map(candidate => (
			<li id={candidate.id} key={candidate.id}>
				<label htmlFor={candidate.id}>
					<span>{candidate.id}: </span>
					<span>{candidate.name}</span>
				</label>
				<input type='radio' name='candidate'
					id={candidate.id}
					value={candidate.id}
					checked={selectedOption === candidate.id}
					onChange={(event) => setSelectedOption(candidate.id)}
				/>
			</li>
		));
	}

	return (
		<div className='VoteInterface'>
			<h2>Vote</h2>
			<form className='CandidateList'
				onSubmit={(event) => {
					event.preventDefault(); // Is it really 2020?
					props.handleSubmit(selectedOption);
				}}
			>
				<ol>
					{generateCandidateItems(props.candidates)}
				</ol>
				<input type='submit'
					value='Vote'
				/>
			</form>
		</div>
	);
}

const ElectionResults = (props) => {
	return (
		<div className='ElectionResults'>
			<h2>Election results</h2>
			<p>No results available</p>
		</div>
	);
}


export default () => {
	const [connected, setConnected] = React.useState(false);
	const [connectionID, setConnectionID] = React.useState('');
	const [registered, setRegistered] = React.useState(false);
	const [hostID, setHostID] = React.useState('');
	const [voterID, setVoterID] = React.useState('');
	const [voterRegistered, setVoterRegistered] = React.useState(false);
	const [electionStatus, setElectionStatus] = React.useState('not running');
	const [voteStatus, setVoteStatus] = React.useState(false);
	
	const [candidates, setCandidates] = React.useState([]);

	const action_handlers = {
		accept_connection: (payload) => {
			setConnected(payload.connected);
			setConnectionID(payload.connection_id);
		},
		accept_registration: (payload) => {
			setRegistered(payload.accepted);
			if (payload.accepted) {
				setHostID(payload.hostID);
			}
		},
		accept_voter_registration: (payload) => {
			setVoterRegistered(payload.verified);
		},
		update_candidates: (payload) => {
			setCandidates(payload.candidates);
		},
		update_election_status: (payload) => {
			setElectionStatus(payload.election_status);
		},
		accept_vote: (payload) => {
			setVoteStatus(payload);
		}
	};

	const socket = new WebSocket(config.url);

	React.useEffect(() => {
		socket.addEventListener('open', (event) => {
			socket.send(JSON.stringify({
				type: 'connect',
				payload: { connection_type: 'client' }
			}));
		});

		socket.addEventListener('message', (event) => {
			const action = JSON.parse(event.data);
			console.log(action);
			action_handlers[action.type](action.payload);
		});
	}, []);

	function connectionHandler(hostID) {
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'register_client',
			payload: {
				host: hostID
			}
		}));
	}

	function newVoterHandler(name) {
		console.log(name);
		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'register_voter',
			payload: { name: name }
		}));
	}

	function voteHandler(candidate) {
		function readable_id() {
			const id = customAlphabet('1234567890abcdef', 8)();
			const readable_id = `${id.slice(0, 4)}-${id.slice(4)}`
			return readable_id;
		}

		const vote_id = readable_id();
		setVoterID(vote_id);

		console.log(vote_id, voterID);

		socket.send(JSON.stringify({
			connection: connectionID,
			type: 'send_vote',
			payload: {
				vote_id: vote_id,
				candidate_id: candidate
			}
		}));
	}

	return (
		<div className='App'>
			<StatusLine
				connected={connected}
				connectionID={connectionID}
				hostID={hostID}
				voterID={voterID}
				voterRegistered={voterRegistered}
				voteStatus={voteStatus}
				electionStatus={electionStatus}
			/>

			<ConnectionView 
				handleSubmit={connectionHandler}
			/>

			<VoterRegistration 
				handleSubmit={newVoterHandler}
			/>

			<VoteInterface
				candidates={candidates}
				handleSubmit={voteHandler}
			/>
		</div>
	);
}