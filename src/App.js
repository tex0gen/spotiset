import React, { createRef, useEffect, useState } from 'react';
import logo from './logo.png';
import './sass/main.scss';

const authEndpoint = 'https://accounts.spotify.com/authorize/';
const baseURL = 'https://api.spotify.com/v1';
const clientId = "919fdd924dc248feafc11a463bb14f69";
const redirectUri = "http://localhost:3000";
// const redirectUri = "spotiset://";
const scopes = [
  'user-read-email',
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public'
];

const hash = window.location.hash
// const hash = window.location.search
  .substring(1)
  .split("&")
  .reduce((initial, item) => {
    if (item) {
      const parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }

    return initial;
  }, {});

window.location.hash = "";

const App = () => {
  const searchRef = createRef();

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [spotifyList, setSpotifyList] = useState({});
  const [myData, setData] = useState({
    complete: false,
    playlistName: "",
    playlistID: "",
    matchedTracks: [],
    results: {},
    tracklist: [],
    selected: [],
    selectList: [],
    search: "",
    profile: null,
  });

  useEffect(() => {
    let _token = hash.access_token;

    if (_token) {
      const getCurrentUser = async (token) => {
        await fetch(`${baseURL}/me`, {
          headers: {
            'Authorization': 'Bearer ' + token
          }
        })
        .then(res => res.json())
        .then(
          (result) => {
            setData(prevState => ({
              ...prevState,
              profile: result.id,
            }));
            setToken(token);
          },
          (error) => {
            alert('Could not get the current user');
            resetData();
          }
        );
      }

      getCurrentUser(_token);
    }
  }, []);

  useEffect(() => {
    showTracklist();
  }, [myData.tracklist]);

  useEffect(() => {
    getMatchedlist();
  }, [spotifyList]);

  const resetData = () => {
    setSpotifyList({});
    setData(prevState => ({
      ...prevState,
      complete: true,
      playlistName: "",
      playlistID: "",
      matchedTracks: [],
      results: {},
      tracklist: [],
    }));
  }

  const searchOnChange = e => {
    setData(prevState => ({
      ...prevState,
      search: searchRef.current.value
    }));
  }

  const onSubmit = async e => {
    e.preventDefault();

    const { search } = myData;

    setLoading(true);

    const response = await fetch("https://www.1001tracklists.com/ajax/search_tracklist.php?p="+search+"&noIDFieldCheck=true&fixedMode=true&sf=p");
    const tracks = await response.json();

    setData(prevState => ({
      ...prevState,
      results: tracks
    }));

    setLoading(false);
  }

  const showTracklist = () => {
    const { tracklist } = myData;

    if (tracklist.length > 0) {
      tracklist.forEach((elem, ind) => {
        searchTrack(elem, ind);
      });

      getMatchedlist();
    }
  }

  const getTracklist = async (ind) => {
    const { results } = myData;

    setData(prevState => ({
      ...prevState,
      playlistName: results.data[ind].properties.tracklistname
    }));

    setLoading(true);

    const uri = results.data[ind].properties.tracklistname;
    let newuri = uri.replace(/\s+/g, '-').toLowerCase();
    newuri = newuri.replace('---', '-').toLowerCase();
    const response = await fetch("http://localhost:4000/" + results.data[ind].properties.id_unique + "/" + encodeURI(newuri)+".html");
    const tracklisting = await response.json();

    setData(prevState => ({
      ...prevState,
      tracklist: tracklisting,
      results: {}
    }));

    setLoading(false);
  }

  const getResults = () => {
    const { results } = myData;
    if (results.data) {
      return Object.entries(results.data).map((elem, ind) => {
        return <tr key={ind}><td><button onClick={() => getTracklist(ind)}>{elem[1].properties.tracklistname}</button></td></tr>;
      });
    }
  }

  const searchTrack = async (query, index) => {
    query = query.replace(/ ft\..+?- /i, ' '); // Removes 'ft. Sirah -'
    query = query.replace(/ & /i, ' '); // Replaces ' & ' with a space
    query = query.replace('- ', ''); // Removes '- ' if present
    // remove bracket left
    query = query.replace('(', '');
    query = query.replace(')', '');
    // lowercase query
    query = query.toLowerCase();

    const response = await fetch(`${baseURL}/search?q=${query}&type=track`, {
      headers: {
        'Authorization': 'Bearer ' + token
      },
    });
    const track = await response.json();

    console.log(query, track);

    setSpotifyList(prevState => ({
      ...prevState,
      [index]: track
    }));
  }

  const createPlaylist = async (selected = false) => {
    const { playlistName, profile } = myData;
    if (playlistName !== "") {
      const response = await fetch(`${baseURL}/users/${profile}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistName,
          description: 'Playlist generated by Spotiset: https://tex0gen.github.io/spotiset/',
        })
      });
      const playlist = await response.json();

      if (selected === true) {
        addTracksToPlaylist(playlist.id, true);
      } else {
        addTracksToPlaylist(playlist.id, false);
      }
    }
  }

  const addTracksToPlaylist = async (playlist, selected) => {
    const { matchedTracks, selectList } = myData;

    let tracksToAdd;

    if (selected) {
      tracksToAdd = selectList;
    } else {
      tracksToAdd = matchedTracks;
    }

    if (tracksToAdd) {
      await fetch(`${baseURL}/playlists/${playlist}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: tracksToAdd
        })
      });

      setData(prevState => ({
        ...prevState,
        complete: true
      }));
    } else {
      alert('No tracks to add');
    }
  }

  const selectTrack = (e) => {
    const { selectList } = myData;

    selectList.push(e.target.value);

    setData(prevState => ({
      ...prevState,
      selectList: selectList
    }));
  }

  const getMatchedlist = () => {
    const { tracklist } = myData;

    let matched = [];
    
    if (tracklist) {
      if (tracklist.length === Object.keys(spotifyList).length) {
        tracklist.forEach((elem, index) => {
          let splitTrackArtists = elem.split(' - '),
              trackName = splitTrackArtists[1].replace(/\((.*)\)/i, '');
          // console.log(trackName);
          // if (trackName === 'Moar Ghosts N Stuff') {
          //   console.log('spl', spotifyList[index]);
          // }
          if (spotifyList[index]) {
            if (spotifyList[index].tracks.items.length > 0) {
              // for (var i = 0; i < spotifyList[index].tracks.items.length; i++) {
                // if (spotifyList[index].tracks.items[i].name.includes(trackName)) {
                  matched.push(spotifyList[index].tracks.items[0].uri);
                  // break;
                // }
              // }
            }
          }
        });

        if (matched.length > 0) {
          setData(prevState => ({
            ...prevState,
            matchedTracks: matched
          }))
        }
      }
    }
  }

  const showMatchlist = () => {
    const { tracklist } = myData;

    if (tracklist) {
      return tracklist.map((elem, index) => {
        let splitTrackArtists = elem.split(' - '),
            trackName = splitTrackArtists[1].replace(/\((.*)\)/i, '');
        
        if (spotifyList[index] && spotifyList[index].tracks.items.length > 0) {
          for (let i = 0; i < spotifyList[index].tracks.items.length; i++) {
            // if (spotifyList[index].tracks.items[i].name.includes(trackName)) {
              let artists = "";
              if (spotifyList[index].tracks.items[i].artists.length > 1) {
                spotifyList[index].tracks.items[i].artists.forEach((artist, artistIndex) => {
                  artists += (spotifyList[index].tracks.items[i].artists.length === (artistIndex + 1)) ? artist.name:artist.name + ' & ';
                });
              } else {
                artists = spotifyList[index].tracks.items[i].artists[0].name;
              }

              return <tr key={index}><td><input type="checkbox" onChange={(e) => selectTrack(e)} value={spotifyList[index].tracks.items[i].uri} /></td><td>Track {(index + 1)}</td><td>{elem}</td><td width="300"><a target="_blank" rel="noopener noreferrer" href={spotifyList[index].tracks.items[i].external_urls.spotify}><img src={spotifyList[index].tracks.items[i].album.images[2].url} alt={artists + " - " + spotifyList[index].tracks.items[i].name} className="img-fluid" />{artists + " - " + spotifyList[index].tracks.items[i].name}</a></td></tr>;
            }
          // }
        } else {
          return <tr key={index}><td></td><td>Track {(index + 1)}</td><td>{elem}</td><td>No Match</td></tr>;
        }
        
        return <tr key={index}><td></td><td>Track {(index + 1)}</td><td>{elem}</td><td>No Match</td></tr>;
      });
    }
  }

  const getMainData = () => {
    if (loading) {
      return (<main className="text-center">Loading...</main>)
    } else {
      return (
        <main>
          <h1>{playlistName}</h1>
          <table className="App-results"><tbody>{getResults()}</tbody></table>
      
          {
            (tracklist.length > 0) && (
              <table className="App-matchlist">
                <thead>
                  <tr>
                    <td></td>
                    <td>Track #</td>
                    <td>Artist - Track Name</td>
                    <td>Spotify Result</td>
                  </tr>
                </thead>
                <tbody>
                  {showMatchlist()}
                </tbody>
              </table>
            )
          }
      
          {
            (matchedTracks.length > 0) && (
              <div className="App-button-container">
                <button onClick={() => createPlaylist(true)} className="App-button App-button-alt">Create Playlist With Selected Tracks</button>
                <button onClick={() => createPlaylist(false)} className="App-button">Create Playlist With All Tracks</button>
              </div>
            )
          }
        </main>
      );
    }
  }

  const { search, playlistName, matchedTracks, tracklist, complete } = myData;

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
          {(complete) && (
            <div className="App-complete">Playlist Created</div>
          )}

          {token && (
          <form className="App-form" onSubmit={(e) => onSubmit(e)}>
              <input type="text"
                ref={searchRef}
                value={search}
                onChange={(e) => searchOnChange(e)}
                placeholder="Search a DJ set.."
              />
              <button type="submit">{(loading) ? 'Loading..':'Search'}</button>
            </form>
          )}

          {!token && (
          <a className="App-button" rel="noopener noreferrer" href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=false`}>
              Login to Spotify
            </a>
          )}
      </header>
      {getMainData()}
      <footer>
        <a href="https://tex0gen.github.io/spotiset/" target="_blank">Spotiset</a> - By <a href="https://github.com/tex0gen" target="_blank">Tex0gen</a>
      </footer>
    </div>
  );
}

export default App;
