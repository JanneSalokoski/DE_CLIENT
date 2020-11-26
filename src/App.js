import React from 'react';
import { nanoid, customAlphabet } from 'nanoid';

import './App.css';

const config = {
	//url: 'ws://thawing-sands-14294.herokuapp.com/',
	url: 'ws://localhost:8000',
	version: '1.0.0'
};


const StatusLine = (props) => {
	return props.enabled ? (
		<div className='StatusLine'>
		<div>
			<div className={`StatusItem Connected ${props.connected ? 'online' : 'offline'}`} id='connected'>
				{props.connected ? 'Online' : 'Offline'}
			</div>
			<div className={`StatusItem ConnectionID ${props.connected ? 'enabled' : 'disabled'}`}>
				{props.connectionID}
			</div>
			<div className='StatusItem ServerAddress'>
				{config.url}
			</div>
		</div>
		<div>
			<div className={`StatusItem  HostConnected ${props.clientRegistered ? 'enabled' : 'disabled'}`} id='voterRegistered'>
				Palvelin
			</div>
			<div className={`StatusItem HostID ${props.clientRegistered ? 'enabled' : 'disabled'}`} id='voterRegistered'>
				{props.hostID}
			</div>

			<div className={`StatusItem Verified ${props.voterRegistered ? 'enabled' : 'disabled'}`} id='voterRegistered'>
				Varmistettu
			</div>
			<div className={`StatusItem VoteGiven ${props.voteStatus ? 'enabled' : 'disabled'}`} id='voteStatus'>
				Ääni käsitelty
			</div>
			<div className={`StatusItem VoterID ${props.voteStatus ? 'enabled' : 'disabled'}`} id='voterID'>
				{props.voterID}
			</div>
		</div>
		</div>
	) : '';
}

const ConnectionView = (props) => {
	const [hostID, setHostID] = React.useState('');

	return props.enabled ? (
		<div className='ConnectionView'>
			<h2>Yhdistä palvelimeen</h2>
			<p className='InfoText'>Liity palvelimelle syöttämällä palvelimen tunniste</p>
			<form onSubmit={(event) => {
				event.preventDefault();
				props.handleSubmit(hostID);
			}}>
				<label htmlFor='hostID'>Palvelimen tunniste: </label>
				<input type='text' id='hostID'
					value={hostID}
					onChange={(event) => setHostID(event.target.value)}
				/>
				<input type='submit' value='Yhdistä' />
			</form>
		</div>
	) : '';
}

const VoterRegistration = (props) => {
	const [newVoterName, setNewVoterName] = React.useState("");

	return props.enabled ? (
		<div className='VoterRegistration'>
			<h2>Rekisteröidy äänestäjäksi</h2>
			<p className='InfoText'>Rekisteröidy äänestäjäksi omalla nimelläsi</p>
			<label>Nimi: </label>
			<input type="text"
				value={newVoterName}
				onChange={(event) => setNewVoterName(event.target.value)}
			/>
			<input type='button'
				value='Rekisteröidy'
				onClick={(event) => props.handleSubmit(newVoterName)}
			/>
		</div>
	) : '';
}

const VoteInterface = (props) => {
	const [selectedOption, setSelectedOption] = React.useState("");

	function generateCandidateItems(candidates) {
		console.log(candidates);
		return candidates.map(candidate => (
			<li id={candidate.id} key={candidate.id}>
				<label htmlFor={candidate.id}>
					<span className='candidateID'>{candidate.id} </span>
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

	return props.enabled ? (
		<div className='VoteInterface'>
			<h2>Äänestä</h2>
			<div className='CandidateList'>
				<ol>
					{generateCandidateItems(props.candidates)}
				</ol>
			</div>
			<label htmlFor='vote'>Ännestä valitsemaasi ehdokasta: </label>
			<input type='submit' id='vote'
				value='Äänestä'
				onClick={(event) => {
					props.handleSubmit(selectedOption);
				}}
			/>
		</div>
	) : '';
}

const GoodbyeMessage = (props) => {
	return props.enabled ? (
		<div className='GoodbyeMessage'>
			<p>
				Kiitos äänestäsi! Vaali on päättynyt ja vaalitulos on selvillä vaalin järjestäjällä.
			</p> 
			<p>
				Pidä oma äänitunnisteesi <span className='voterID'>{props.voterID}</span> tallessa. Vaalituloksesta voit tarkistaa, menikö kaikki vaalissa oikein. Osallistuaksesi uuteen vaaliin, voit päivittää tämän sivun! 
			</p>
		</div>
	) : '';
}


export default () => {
	const [connected, setConnected] = React.useState(false);
	const [connectionID, setConnectionID] = React.useState('');
	const [registered, setRegistered] = React.useState(false);
	const [hostID, setHostID] = React.useState('');
	const [voterID, setVoterID] = React.useState('');
	const [voterRegistered, setVoterRegistered] = React.useState(false);
	const [electionStatus, setElectionStatus] = React.useState(false);
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
			<h1 className='title'>DE_CLIENT [{config.version}]</h1>
			<StatusLine enabled={true}
				connected={connected}
				connectionID={connectionID}
				clientRegistered={registered}
				hostID={hostID}
				voterID={voterID}
				voterRegistered={voterRegistered}
				voteStatus={voteStatus}
				electionStatus={electionStatus}
			/>

			<ConnectionView enabled={!registered}
				handleSubmit={connectionHandler}
			/>

			<VoterRegistration enabled={!voterRegistered}
				handleSubmit={newVoterHandler}
			/>

			<VoteInterface enabled={!voteStatus && electionStatus}
				candidates={candidates}
				handleSubmit={voteHandler}
			/>

			<GoodbyeMessage enabled={!electionStatus && voteStatus} voterID={voterID}/>
		</div>
	);
}
