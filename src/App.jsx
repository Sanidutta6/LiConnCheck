import { useState, useRef, useEffect } from "react";
import { Navbar, Label, Textarea, Button, Table } from "flowbite-react";
import logoUrl from './assets/logo.png';
import './App.css';

function App() {
  const delay = 10;
  const [links, setLinks] = useState([]);
  const [result, setResult] = useState([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [linkIndex, setLinkIndex] = useState(0);
  const [isScraping, setIsScraping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const isPausedRef = useRef(isPaused);
  const isScrapingRef = useRef(isScraping);
  const linkIndexRef = useRef(linkIndex);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isScrapingRef.current = isScraping;
  }, [isScraping]);

  useEffect(() => {
    linkIndexRef.current = linkIndex;
  }, [linkIndex]);

  const handleTxtareaChng = (event) => {
    let enteredText = event.target.value;
    enteredText = enteredText.split('\n').map(link => link.trim()).filter(link => link !== '');
    setLinks(enteredText);
    setTotalLinks(enteredText.length);
  };

  const insertRow = (newRow) => {
    setResult(prevResult => [...prevResult, newRow]);
  };

  const handleDownload = () => {
    // Create the header row
    const header = "Link, Status";

    // Map the result to CSV format, wrapping values containing commas in double quotes
    const csvContent = result.map(res => res.map(value => (value.includes(',') ? `"${value}"` : value)).join(',')).join('\n');

    // Combine the header and the CSV content
    const fullCsvContent = [header, csvContent].join('\n');

    // Create a Blob containing the CSV data
    const blob = new Blob([fullCsvContent], { type: 'text/csv' });

    // Create a download link and trigger the download
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'result.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };


  const handleExec = async () => {
    if (totalLinks <= 0) {
      return;
    }

    setIsScraping(true);
    isScrapingRef.current = true;
    isPausedRef.current = false;

    for (let i = linkIndexRef.current; i < links.length; i++) {
      if (!isScrapingRef.current) {
        break;
      }

      while (isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const link = links[i];
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "search", link, delay }, (response) => {
          resolve(response);
        });
      });

      if (response && response.connStatus && response.connStatus.length > 0 && response.connStatus[0].result !== null) {
        const resultArray = [link, response.connStatus[0].result]; // Create a new array with link and result
        insertRow(resultArray); // Insert the new row into the table
      } else {
        console.error("Error extracting texts.");
      }

      setLinkIndex(prevLinkIndex => prevLinkIndex + 1);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Adding a small delay
    }

    setIsScraping(false);
    isScrapingRef.current = false;
  };

  const handlePauseResume = () => {
    setIsPaused(!isPausedRef.current);
    isPausedRef.current = !isPausedRef.current;
  };

  return (
    <>
      <Navbar className="bg-gray-900" fluid>
        <Navbar.Brand>
          <img src={logoUrl} className="mr-3 h-6 sm:h-9" alt="Logo" />
          <span className="self-center whitespace-nowrap text-xl font-semibold text-white">LiConnCheck</span>
        </Navbar.Brand>
      </Navbar>
      <div className="h-[2px] w-full block bg-blue-700"></div>
      <main className="bg-gray-900 text-white justify-center h-full w-full grid grid-cols-1 grid-rows-6 gap-6 px-6">
        {/* Form */}
        <form className="row-span-2">
          {/* Input for links */}
          <div className="mb-5">
            <div className="mb-2 block">
              <Label className="text-white" htmlFor="links" value="Enter links" />
            </div>
            <Textarea id="links"
              className="border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-cyan-500 focus:ring-cyan-500 resize-none"
              placeholder="Enter newline separated links"
              rows={4}
              helperText={<span className="text-yellow-500">No. of Links Processed: {linkIndex}/{totalLinks}</span>}
              onChange={(e) => { handleTxtareaChng(e) }}
              required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              id="get-statusBtn"
              isProcessing={isScraping && !isPausedRef.current}
              onClick={handleExec}
              disabled={isScraping && !isPausedRef.current}
            >
              {isScraping && !isPausedRef.current ? "Scraping..." : "Get Status"}
            </Button>
            <Button
              id="pause-resumeBtn"
              onClick={handlePauseResume}
              disabled={!isScraping}
            >
              {isPausedRef.current ? "Resume" : "Pause"}
            </Button>
          </div>
        </form>

        {/* Table */}
        <div className="row-span-4 mt-6">
          <div className="bg-gray-800 relative shadow-md overflow-hidden flex justify-between px-6 py-3 sm:rounded-t-lg">
            <h3 className="text-xl font-semibold">Result</h3>
            <Button
              onClick={handleDownload}
              disabled={(linkIndexRef.current > 0) ? false : true}
            >Download</Button>
          </div>
          <div className="overflow-y-auto max-h-60">
            <Table>
              <Table.Head className="text-white border-b-2 border-b-gray-300">
                <Table.HeadCell className="bg-gray-800 rounded-b-none">Links</Table.HeadCell>
                <Table.HeadCell className="bg-gray-800 rounded-b-none">Status</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {result.map((row, index) => (
                  <Table.Row key={index} className="border-gray-700 bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-white">
                      {row[0]}
                    </Table.Cell>
                    <Table.Cell>{row[1]}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
