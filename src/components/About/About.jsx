import React from 'react';

const About = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">About This Assistant</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-4 text-gray-700">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h3>
              <p className="text-yellow-700">
                This is an <strong>unofficial, independent project</strong> and is <strong>NOT affiliated with, endorsed by, or officially connected</strong> to the University of Texas at El Paso (UTEP) in any way.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What This Is</h3>
              <p>
                This AI assistant was created as an independent project to help users find information about UTEP. 
                It uses publicly available information from UTEP's website and AI technology to provide responses.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Limitations & Accuracy</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Information may be outdated, incomplete, or inaccurate</li>
                <li>Always verify important information with official UTEP sources</li>
                <li>This assistant cannot make official decisions or commitments</li>
                <li>For official information, visit <a href="https://www.utep.edu" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">utep.edu</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">No Liability</h3>
              <p>
                The creator of this assistant assumes <strong>no responsibility or liability</strong> for:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Accuracy of information provided</li>
                <li>Decisions made based on this assistant's responses</li>
                <li>Any damages or consequences from using this service</li>
                <li>Technical issues or service availability</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Privacy</h3>
              <p>
                Conversations are deleted when you refresh the page, clear the chat, or close your browser. However, use discretion and avoid sharing sensitive personal information.
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <h3 className="font-semibold text-blue-800 mb-2">For Official UTEP Information</h3>
              <div className="text-blue-700 space-y-1">
                <p>• Website: <a href="https://www.utep.edu" className="underline" target="_blank" rel="noopener noreferrer">utep.edu</a></p>
                <p>• Admissions: <a href="https://www.utep.edu/admissions" className="underline" target="_blank" rel="noopener noreferrer">utep.edu/admissions</a></p>
                <p>• Registrar: <a href="https://www.utep.edu/student-affairs/registrar" className="underline" target="_blank" rel="noopener noreferrer">utep.edu/student-affairs/registrar</a></p>
                <p>• Phone: (915) 747-5000</p>
              </div>
            </div>

            <div className="text-sm text-gray-500 pt-4 border-t">
              <p>
                By using this assistant, you acknowledge that you have read and understood these disclaimers.
                This is an independent, educational project created by a third party.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;