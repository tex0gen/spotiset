import React, { Component, createRef } from 'react';
import logo from './logo.png';
import './sass/main.scss';

export const authEndpoint = 'https://accounts.spotify.com/authorize/';

const baseURL = 'https://api.spotify.com/v1';
const clientId = "919fdd924dc248feafc11a463bb14f69";
const redirectUri = "http://localhost:3000";
const scopes = [
  'user-read-email',
  'playlist-read-private',
  'playlist-modify-private',
  'playlist-modify-public'
];

const hash = window.location.hash
  .substring(1)
  .split("&")
  .reduce((initial, item) => {
    if (item) {
      var parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
    }

    return initial;
  }, {});

window.location.hash = "";

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      playlistName: "",
      playlistID: "",
      matchedTracks: [],
      results: {},
      tracklist: [],
      spotifyList: {},
      selected: [],
      search: "",
      token: null,
      profile: null,
      loading: false,
    };

    this.searchRef = createRef();
    this.selectedRef = createRef();
  }

  onChange = e => {
    this.setState({ search: e.target.value });
  }

  onSubmit = e => {
    e.preventDefault();

    const { search } = this.state;

    this.setState({loading: true});

    fetch("https://www.1001tracklists.com/ajax/search_tracklist.php?p="+search+"&noIDFieldCheck=true&fixedMode=true&sf=p")
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            loading: false,
            results: result
          });
        },
        (error) => {
          this.setState({
            loading: false,
            error
          });
        }
      );
  }

  showTracklist = () => {
    const { tracklist } = this.state;

    if (tracklist.length > 0) {
      tracklist.forEach((elem, ind) => {
        this.searchTrack(elem, ind);
      });

      this.getMatchedlist();
    }
  }

  getTracklist = async (ind) => {
    const { results } = this.state;

    this.setState({playlistName: results.data[ind].properties.tracklistname, loading: true});

    await fetch("http://localhost:4000/"+results.data[ind].properties.id_unique+"/"+encodeURI(results.data[ind].properties.tracklistname)+".html")
    .then(res => res.json())
    .then(
      (result) => {
        this.setState({tracklist: result, loading: false, results: {}}, this.showTracklist);
      },
      (error) => {
        console.log(error);
      }
    )
  }

  getResults = () => {
    const { results } = this.state;
    if (results.data) {
      return Object.entries(results.data).map((elem, ind) => {
        return <tr key={ind}><td><button onClick={() => this.getTracklist(ind)}>{elem[1].properties.tracklistname}</button></td></tr>;
      });
    }
  }

  getCurrentUser = (token) => {
    fetch(`${baseURL}/me`, {
      headers: {
        'Authorization':'Bearer ' + token
      }
    })
    .then(res => res.json())
    .then(
      (result) => {
        // localStorage.set('token', token);

        this.setState({
          profile: result.id,
          token: token
        });
      },
      (error) => {
        // this.setState({
        //   loading: false,
        //   error
        // });
      }
    );
  }

  searchTrack = async (query, index) => {
    const { token } = this.state;

    query = query.replace(/ ft.+-/i, '');
    query = query.replace('- ', '');

    await fetch(`${baseURL}/search?q=${query}&type=track`, {
      headers: {
        'Authorization': 'Bearer ' + token
      },
    })
    .then(res => res.json())
    .then(
      (result) => {
        this.setState(prevState => ({spotifyList: {
            ...prevState.spotifyList,
            [index]: result
          }
        }), this.getMatchedlist);
      },
      (error) => {
        // this.setState({
        //   loading: false,
        //   error
        // });
      }
    );
  }

  createPlaylist = async (selected = false) => {
    const { playlistName, profile, token } = this.state;

    if (playlistName !== "") {
      await fetch(`${baseURL}/users/${profile}/playlists`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: playlistName
        })
      })
      .then(res => res.json())
      .then(
        (result) => {
          if (selected === true) {
            this.addTracksToPlaylist(result.id);
          } else {
            this.addTracksToPlaylist(result.id);
          }
        },
        (error) => {
          console.log('Error', error);
        }
      );
    }
  }

  addTracksToPlaylist = async (playlist) => {
    const {matchedTracks, token} = this.state;

    if (matchedTracks) {
      await fetch(`${baseURL}/playlists/${playlist}/tracks`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: matchedTracks
        })
      })
      .then(res => res.json())
      .then(
        (result) => {
          this.setState({
            complete: true,
            playlistName: "",
            playlistID: "",
            matchedTracks: [],
            results: {},
            tracklist: [],
            spotifyList: {},
          });
        },
        (error) => {
          console.log('Error', error);
        }
      );
    }
  }

  getMatchedlist = () => {
    const { spotifyList, tracklist } = this.state;

    let matched = [];

    if (tracklist) {
      if (tracklist.length === Object.keys(spotifyList).length) {
        tracklist.forEach((elem, index) => {
          let splitTrackArtists = elem.split(' - '),
              trackName = splitTrackArtists[1].replace(/\((.*)\)/i, '');
          
          if (spotifyList[index]) {
            if (spotifyList[index].tracks.items.length > 0) {
              for (var i = 0; i < spotifyList[index].tracks.items.length; i++) {
                if (spotifyList[index].tracks.items[i].name.includes(trackName)) {
                  matched.push(spotifyList[index].tracks.items[i].uri);
                  break;
                }
              }
            }
          }
        });

        if (matched.length > 0) {
          this.setState({matchedTracks: matched});
        }
      }
    }
  }

  showMatchlist = () => {
    const { spotifyList, tracklist } = this.state;

    if (tracklist) {
      return tracklist.map((elem, index) => {
        let splitTrackArtists = elem.split(' - '),
            trackName = splitTrackArtists[1].replace(/\((.*)\)/i, '');
        
        if (spotifyList[index]) {
          if (spotifyList[index].tracks.items.length > 0) {
            for (var i = 0; i < spotifyList[index].tracks.items.length; i++) {
              if (spotifyList[index].tracks.items[i].name.includes(trackName)) {
                let artists = "";
                if (spotifyList[index].tracks.items[i].artists.length > 1) {
                  spotifyList[index].tracks.items[i].artists.map((artist, artistIndex) => {
                    artists += (spotifyList[index].tracks.items[i].artists.length === (artistIndex + 1)) ? artist.name:artist.name + ' & ';
                  });
                } else {
                  artists = spotifyList[index].tracks.items[i].artists[0].name;
                }

                return <tr key={index}><td><input type="checkbox" ref={this.selectedRef} /></td><td>Track {(index + 1)}</td><td>{elem}</td><td width="300"><a target="_blank" rel="noopener noreferrer" href={spotifyList[index].tracks.items[i].external_urls.spotify}><img src={spotifyList[index].tracks.items[i].album.images[2].url} alt={artists + " - " + spotifyList[index].tracks.items[i].name} className="img-fluid" />{artists + " - " + spotifyList[index].tracks.items[i].name}</a></td></tr>;
                break;
              }
            }
          } else {
            return <tr key={index}><td></td><td>Track {(index + 1)}</td><td>{elem}</td><td>No Match</td></tr>;
          }
        } else {
          return <tr key={index}><td></td><td>Track {(index + 1)}</td><td>{elem}</td><td>No Match</td></tr>;
        }
        
      });
    }
  }

  componentDidMount() {
    let _token = hash.access_token;

    if (_token) {
      this.getCurrentUser(_token);
    }
  }

  render() {
    const { search, playlistName, matchedTracks, tracklist, complete, results } = this.state;
  
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
            {(complete) && (
              <div className="App-complete">Playlist Created</div>
            )}
            {this.state.token && (
              <form action="?" onSubmit={this.onSubmit} className="App-form">
                <input type="text"
                  ref={this.searchRef}
                  value={search}
                  onChange={this.onChange}
                  placeholder="Search a DJ set.."
                />
                <button onClick={this.search}>{(this.state.loading) ? 'Loading..':'Search'}</button>
              </form>
            )}

            {!this.state.token && (
              <a className="App-button" href={`${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join("%20")}&response_type=token&show_dialog=true`}>
                Login to Spotify
              </a>
            )}

        </header>
        <main>
          <h1>{playlistName}</h1>
          {(results.length > 0) && (
            <table className="App-results"><tbody>{this.getResults()}</tbody></table>
          )}

          {(tracklist.length > 0) && (
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
                {this.showMatchlist()}
              </tbody>
            </table>
          )}

          {(matchedTracks.length > 0) && (
            <div className="App-button-container">
              <button onClick={() => this.createPlaylist(true)} className="App-button App-button-alt">Create Playlist With Selected Tracks</button>
              <button onClick={this.createPlaylist} className="App-button">Create Playlist With All Tracks</button>
            </div>
          )}
        </main>
        <footer>
          Spotiset 2020
        </footer>
      </div>
    );
  }
}

export default App;
